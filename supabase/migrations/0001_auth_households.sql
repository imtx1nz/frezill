-- frezill M1: profiles, households, memberships, fridges + RLS + signup trigger

create type public.member_role as enum ('owner', 'member', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  easy_mode boolean not null default false,
  diet_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Bangkok',
  invite_code text unique,
  invite_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (user_id, household_id)
);
create index memberships_household_idx on public.memberships (household_id);

create table public.fridges (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null default 'ตู้เย็นในครัว',
  capacity_liters numeric, -- reserved for Fridge Capacity Meter
  created_at timestamptz not null default now()
);
create index fridges_household_idx on public.fridges (household_id);

-- Membership helpers. SECURITY DEFINER so policies on memberships do not recurse.
create function public.member_role_in(hid uuid)
returns public.member_role
language sql stable security definer set search_path = ''
as $$
  select m.role from public.memberships m
  where m.household_id = hid and m.user_id = (select auth.uid())
$$;

create function public.is_member(hid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select public.member_role_in(hid) is not null $$;

create function public.can_write(hid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select public.member_role_in(hid) in ('owner', 'member') $$;

create function public.is_owner(hid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select public.member_role_in(hid) = 'owner' $$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.fridges enable row level security;

-- profiles: yourself, plus people you share a household with (to show names)
create policy "profiles: read self and housemates" on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.memberships m
      where m.user_id = profiles.id and public.is_member(m.household_id)
    )
  );
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- households: members read, owner edits/deletes; creation happens in the signup trigger
create policy "households: members read" on public.households for select to authenticated
  using (public.is_member(id));
create policy "households: owner updates" on public.households for update to authenticated
  using (public.is_owner(id)) with check (public.is_owner(id));
create policy "households: owner deletes" on public.households for delete to authenticated
  using (public.is_owner(id));

-- memberships: members see the roster; owner manages; anyone may leave
create policy "memberships: members read" on public.memberships for select to authenticated
  using (public.is_member(household_id));
create policy "memberships: owner updates roles" on public.memberships for update to authenticated
  using (public.is_owner(household_id)) with check (public.is_owner(household_id));
create policy "memberships: owner removes or self leaves" on public.memberships for delete to authenticated
  using (public.is_owner(household_id) or user_id = (select auth.uid()));

-- fridges: members read, owner/member write
create policy "fridges: members read" on public.fridges for select to authenticated
  using (public.is_member(household_id));
create policy "fridges: writers insert" on public.fridges for insert to authenticated
  with check (public.can_write(household_id));
create policy "fridges: writers update" on public.fridges for update to authenticated
  using (public.can_write(household_id)) with check (public.can_write(household_id));
create policy "fridges: owner deletes" on public.fridges for delete to authenticated
  using (public.is_owner(household_id));

-- On signup: profile + "บ้านของ<name>" + owner membership + default fridge
create function public.handle_new_user()
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
  insert into public.profiles (id, display_name) values (new.id, left(v_name, 40));

  insert into public.households (name) values ('บ้านของ' || left(v_name, 40))
  returning id into v_household;

  insert into public.memberships (user_id, household_id, role) values (new.id, v_household, 'owner');
  insert into public.fridges (household_id) values (v_household);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
