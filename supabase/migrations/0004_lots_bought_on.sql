-- frezill: purchase date on lots. Safe to re-run.
-- NOTE: branch m1-invites has its own 0002; renumber one of them when merging.
alter table public.lots add column if not exists bought_on date;
update public.lots set bought_on = (created_at at time zone 'Asia/Bangkok')::date where bought_on is null;
alter table public.lots alter column bought_on set default ((now() at time zone 'Asia/Bangkok')::date);
alter table public.lots alter column bought_on set not null;
