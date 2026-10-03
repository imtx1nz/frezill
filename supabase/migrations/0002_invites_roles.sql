-- frezill M1 (part 2): invites, joining, role management, current household

alter table public.profiles
  add column current_household_id uuid references public.households (id) on delete set null;

-- Membership changes go through the RPCs below, which enforce the rules
-- (never leave a household without an owner).
drop policy "memberships: owner updates roles" on public.memberships;
drop policy "memberships: owner removes or self leaves" on public.memberships;

-- Existing users: point them at their first household
update public.profiles p
set current_household_id = (
  select m.household_id from public.memberships m
  where m.user_id = p.id order by m.created_at limit 1
)
where p.current_household_id is null;

-- New signups start in the household the trigger creates
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );
  v_household uuid;
begin
  insert into public.households (name) values ('บ้านของ' || left(v_name, 40))
  returning id into v_household;

  insert into public.profiles (id, display_name, current_household_id)
  values (new.id, left(v_name, 40), v_household);

  insert into public.memberships (user_id, household_id, role) values (new.id, v_household, 'owner');
  insert into public.fridges (household_id) values (v_household);
  return new;
end;
$$;

-- 8-char code without look-alike characters (0/O, 1/I/L)
create function public.new_invite_code()
returns text language sql volatile set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (floor(random() * 31) + 1)::int, 1), '')
  from generate_series(1, 8)
$$;

create function public.create_invite(hid uuid)
returns table (code text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_owner(hid) then
    raise exception 'only the owner can invite' using errcode = '42501';
  end if;
  loop
    begin
      update public.households
      set invite_code = public.new_invite_code(), invite_expires_at = now() + interval '7 days'
      where id = hid
      returning invite_code, invite_expires_at into code, expires_at;
      return next;
      return;
    exception when unique_violation then
      -- extremely rare collision: try another code
    end;
  end loop;
end;
$$;

create function public.revoke_invite(hid uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_owner(hid) then
    raise exception 'only the owner can revoke invites' using errcode = '42501';
  end if;
  update public.households set invite_code = null, invite_expires_at = null where id = hid;
end;
$$;

-- Public preview for the /join page (works before login). Reveals only the name.
create function public.invite_preview(invite text)
returns table (household_name text, member_count int)
language sql stable security definer set search_path = ''
as $$
  select h.name, (select count(*)::int from public.memberships m where m.household_id = h.id)
  from public.households h
  where h.invite_code = upper(trim(invite)) and h.invite_expires_at > now()
$$;

create function public.join_household(invite text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_household uuid;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select h.id into v_household from public.households h
  where h.invite_code = upper(trim(invite)) and h.invite_expires_at > now();
  if v_household is null then
    raise exception 'invite invalid or expired' using errcode = 'P0002';
  end if;

  insert into public.memberships (user_id, household_id, role)
  values (v_uid, v_household, 'member')
  on conflict (user_id, household_id) do nothing;

  update public.profiles set current_household_id = v_household where id = v_uid;
  return v_household;
end;
$$;

create function public.set_member_role(hid uuid, member uuid, new_role public.member_role)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_owner(hid) then
    raise exception 'only the owner can change roles' using errcode = '42501';
  end if;
  if member = (select auth.uid()) then
    raise exception 'owner cannot change their own role' using errcode = '42501';
  end if;
  update public.memberships set role = new_role where household_id = hid and user_id = member;
end;
$$;

-- Owner removes someone else, or anyone leaves — but the last owner cannot leave.
create function public.remove_member(hid uuid, member uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if member <> v_uid and not public.is_owner(hid) then
    raise exception 'only the owner can remove members' using errcode = '42501';
  end if;
  if public.member_role_in(hid) = 'owner' and member = v_uid
     and (select count(*) from public.memberships where household_id = hid and role = 'owner') = 1 then
    raise exception 'last owner cannot leave' using errcode = '42501';
  end if;

  delete from public.memberships where household_id = hid and user_id = member;

  update public.profiles p
  set current_household_id = (
    select m.household_id from public.memberships m where m.user_id = member order by m.created_at limit 1
  )
  where p.id = member and p.current_household_id = hid;
end;
$$;

create function public.switch_household(hid uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_member(hid) then
    raise exception 'not a member' using errcode = '42501';
  end if;
  update public.profiles set current_household_id = hid where id = (select auth.uid());
end;
$$;

-- Only signed-in users may call the mutating RPCs; invite_preview is public.
revoke execute on function public.create_invite(uuid), public.revoke_invite(uuid),
  public.join_household(text), public.set_member_role(uuid, uuid, public.member_role),
  public.remove_member(uuid, uuid), public.switch_household(uuid), public.new_invite_code()
  from public, anon;
grant execute on function public.create_invite(uuid), public.revoke_invite(uuid),
  public.join_household(text), public.set_member_role(uuid, uuid, public.member_role),
  public.remove_member(uuid, uuid), public.switch_household(uuid)
  to authenticated;
grant execute on function public.invite_preview(text) to anon, authenticated;
