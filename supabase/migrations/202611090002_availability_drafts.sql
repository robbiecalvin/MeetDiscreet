begin;
-- Weekly private sketches only: not reservations or authoritative bookable slots.
create function public.valid_weekly_availability_draft(zone text, payload jsonb) returns boolean
language plpgsql stable set search_path = '' as $$
declare item jsonb;
begin
  if zone is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = zone)
    or jsonb_typeof(payload) <> 'array' or octet_length(payload::text) > 32000 then return false; end if;
  for item in select value from jsonb_array_elements(payload) loop
    if jsonb_typeof(item) <> 'object' or not (item ?& array['day','start','end'])
      or item - array['day','start','end'] <> '{}'::jsonb
      or jsonb_typeof(item->'day') <> 'number'
      or (item->>'day')::numeric not between 0 and 6
      or trunc((item->>'day')::numeric) <> (item->>'day')::numeric
      or jsonb_typeof(item->'start') <> 'string' or jsonb_typeof(item->'end') <> 'string'
      or item->>'start' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or item->>'end' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or item->>'start' >= item->>'end' then return false; end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(payload) with ordinality a(item,n)
      cross join jsonb_array_elements(payload) with ordinality b(item,n)
    where a.n < b.n and (a.item->>'day')::numeric = (b.item->>'day')::numeric
      and a.item->>'start' < b.item->>'end' and a.item->>'end' > b.item->>'start'
  ) then return false; end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_weekly_availability_draft(text,jsonb) from public, anon;
grant execute on function public.valid_weekly_availability_draft(text,jsonb) to authenticated;
create table public.availability_drafts (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  time_zone text not null,
  windows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (public.valid_weekly_availability_draft(time_zone, windows) is true)
);
create trigger availability_draft_updated before update on public.availability_drafts
  for each row execute function public.touch_private_draft_updated_at();
alter table public.availability_drafts enable row level security;
alter table public.availability_drafts force row level security;
revoke all on public.availability_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.availability_drafts to authenticated;
create policy availability_draft_owner_select on public.availability_drafts for select to authenticated using ((select auth.uid()) = owner_id);
create policy availability_draft_owner_insert on public.availability_drafts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy availability_draft_owner_update on public.availability_drafts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy availability_draft_owner_delete on public.availability_drafts for delete to authenticated using ((select auth.uid()) = owner_id);
commit;
