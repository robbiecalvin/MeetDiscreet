begin;
-- Private unfinished planning notes, not booking requests or authoritative quotes.
create function public.valid_booking_plan_draft(payload jsonb) returns boolean
language plpgsql stable set search_path = '' as $$
declare field text; bound integer;
begin
  if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>20000
    or not (payload ?& array['sourceOffering','provider','activity','date','time','timeZone','duration','venue','expenses','notes'])
    or payload - array['sourceOffering','provider','activity','date','time','timeZone','duration','venue','expenses','notes'] <> '{}'::jsonb then return false; end if;
  for field,bound in select * from (values ('sourceOffering',80),('provider',80),('activity',40),('date',10),('time',5),('timeZone',100),('duration',16),('venue',200),('expenses',240),('notes',1000)) limits(field,bound) loop
    if jsonb_typeof(payload->field)<>'string' or char_length(payload->>field)>bound then return false; end if;
  end loop;
  if payload->>'activity' not in ('','Coffee','Dining','Culture','Outdoors') then return false; end if;
  if payload->>'date'<>'' then
    if payload->>'date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (payload->>'date')::date::text <> payload->>'date' then return false; end if;
  end if;
  if payload->>'time'<>'' and payload->>'time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
  if payload->>'timeZone'<>'' and not exists(select 1 from pg_catalog.pg_timezone_names where name=payload->>'timeZone') then return false; end if;
  if payload->>'duration'<>'' then
    if payload->>'duration' !~ '^[1-9][0-9]*$' or (payload->>'duration')::numeric > 9007199254740991 then return false; end if;
  end if;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_booking_plan_draft(jsonb) from public,anon;
grant execute on function public.valid_booking_plan_draft(jsonb) to authenticated;
create table public.booking_plan_drafts (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  plan jsonb not null check(public.valid_booking_plan_draft(plan) is true),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger booking_plan_draft_updated before update on public.booking_plan_drafts
  for each row execute function public.touch_private_draft_updated_at();
alter table public.booking_plan_drafts enable row level security;
alter table public.booking_plan_drafts force row level security;
revoke all on public.booking_plan_drafts from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.booking_plan_drafts to authenticated;
create policy booking_plan_owner_select on public.booking_plan_drafts for select to authenticated using ((select auth.uid())=owner_id);
create policy booking_plan_owner_insert on public.booking_plan_drafts for insert to authenticated with check ((select auth.uid())=owner_id);
create policy booking_plan_owner_update on public.booking_plan_drafts for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy booking_plan_owner_delete on public.booking_plan_drafts for delete to authenticated using ((select auth.uid())=owner_id);
commit;
