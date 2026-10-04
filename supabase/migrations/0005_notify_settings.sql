-- frezill: email notification settings on profiles (idempotent)
alter table public.profiles add column if not exists notify_email boolean not null default true;
alter table public.profiles add column if not exists notify_days smallint not null default 3;
alter table public.profiles add column if not exists last_notified_on date;
alter table public.profiles add column if not exists last_test_sent_at timestamptz;

alter table public.profiles drop constraint if exists profiles_notify_days_check;
alter table public.profiles add constraint profiles_notify_days_check check (notify_days between 1 and 3);

-- "profiles: update self" (0001) is row-scoped, not column-restricted, so users can already update these columns.
