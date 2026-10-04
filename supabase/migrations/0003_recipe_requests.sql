-- frezill M5: recipe_requests = one row per AI menu request, only used to count the 10/day/household limit.
-- Safe to re-run. (Branch m1-invites also has a 0002_*; renumber that one to 0004 if it is ever merged.)

create table if not exists public.recipe_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists recipe_requests_household_idx on public.recipe_requests (household_id, created_at);

alter table public.recipe_requests enable row level security;

-- members read (to count); owner/member insert their own rows; no update/delete so the count can't be reset
drop policy if exists "recipe_requests: members read" on public.recipe_requests;
drop policy if exists "recipe_requests: writers insert" on public.recipe_requests;
create policy "recipe_requests: members read" on public.recipe_requests for select to authenticated
  using (public.is_member(household_id));
create policy "recipe_requests: writers insert" on public.recipe_requests for insert to authenticated
  with check (created_by = (select auth.uid()) and public.can_write(household_id));
