-- frezill M2: lots (one row per purchase) + usage_logs + RLS
-- Safe to re-run: tables/indexes use IF NOT EXISTS, policies are dropped first.

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  fridge_id uuid not null references public.fridges (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  category text not null default 'other'
    check (category in ('veg', 'fruit', 'meat', 'seafood', 'dairy_egg', 'drink', 'sauce', 'cooked', 'other')),
  zone text not null default 'chill' check (zone in ('chill', 'freezer')),
  qty numeric not null check (qty >= 0), -- 0 = used up; kept so usage_logs keep their lot
  unit text not null check (char_length(trim(unit)) between 1 and 20),
  expires_at date,
  expiry_guessed boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists lots_fridge_idx on public.lots (fridge_id) where qty > 0;

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  action text not null check (action in ('use', 'finish', 'discard')),
  qty numeric not null check (qty > 0),
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists usage_logs_lot_idx on public.usage_logs (lot_id);

-- Fridge -> household lookup for policies (same SECURITY DEFINER pattern as 0001).
create or replace function public.fridge_household(fid uuid)
returns uuid language sql stable security definer set search_path = ''
as $$ select f.household_id from public.fridges f where f.id = fid $$;

alter table public.lots enable row level security;
alter table public.usage_logs enable row level security;

-- lots: members read, owner/member write
drop policy if exists "lots: members read" on public.lots;
drop policy if exists "lots: writers insert" on public.lots;
drop policy if exists "lots: writers update" on public.lots;
drop policy if exists "lots: writers delete" on public.lots;
create policy "lots: members read" on public.lots for select to authenticated
  using (public.is_member(public.fridge_household(fridge_id)));
create policy "lots: writers insert" on public.lots for insert to authenticated
  with check (public.can_write(public.fridge_household(fridge_id)));
create policy "lots: writers update" on public.lots for update to authenticated
  using (public.can_write(public.fridge_household(fridge_id)))
  with check (public.can_write(public.fridge_household(fridge_id)));
create policy "lots: writers delete" on public.lots for delete to authenticated
  using (public.can_write(public.fridge_household(fridge_id)));

-- usage_logs: members read; writers append their own rows; no update/delete (history)
drop policy if exists "usage_logs: members read" on public.usage_logs;
drop policy if exists "usage_logs: writers insert" on public.usage_logs;
create policy "usage_logs: members read" on public.usage_logs for select to authenticated
  using (exists (
    select 1 from public.lots l
    where l.id = lot_id and public.is_member(public.fridge_household(l.fridge_id))
  ));
create policy "usage_logs: writers insert" on public.usage_logs for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.lots l
      where l.id = lot_id and public.can_write(public.fridge_household(l.fridge_id))
    )
  );
