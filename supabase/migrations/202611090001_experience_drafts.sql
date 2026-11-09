begin;
-- Private catalogue snapshots only; amounts remain currency-pending draft values.
create function public.valid_experience_draft_items(payload jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb;
begin
  if jsonb_typeof(payload) <> 'array' or octet_length(payload::text) > 200000 then return false; end if;
  for item in select value from jsonb_array_elements(payload) loop
    if jsonb_typeof(item) <> 'object'
      or not (item ?& array['title','description','offered','included','minor','feeType'])
      or item - array['title','description','offered','included','minor','feeType'] <> '{}'::jsonb
      or jsonb_typeof(item->'title') <> 'string'
      or length(trim(item->>'title')) not between 1 and 100
      or jsonb_typeof(item->'description') <> 'string' or length(item->>'description') > 1000
      or jsonb_typeof(item->'offered') <> 'boolean' or jsonb_typeof(item->'included') <> 'boolean'
      or jsonb_typeof(item->'minor') <> 'number'
      or (item->>'minor')::numeric < 0 or (item->>'minor')::numeric > 9007199254740991
      or trunc((item->>'minor')::numeric) <> (item->>'minor')::numeric
      or jsonb_typeof(item->'feeType') <> 'string' or item->>'feeType' not in ('once','hourly')
      or ((item->>'included')::boolean and ((item->>'minor')::numeric <> 0 or item->>'feeType' <> 'once'))
    then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_experience_draft_items(jsonb) from public, anon;
grant execute on function public.valid_experience_draft_items(jsonb) to authenticated;
create table public.experience_catalogue_drafts (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (public.valid_experience_draft_items(items) is true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger experience_catalogue_draft_updated before update on public.experience_catalogue_drafts
  for each row execute function public.touch_private_draft_updated_at();
alter table public.experience_catalogue_drafts enable row level security;
alter table public.experience_catalogue_drafts force row level security;
revoke all on public.experience_catalogue_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.experience_catalogue_drafts to authenticated;
create policy experience_draft_owner_select on public.experience_catalogue_drafts for select to authenticated using ((select auth.uid()) = owner_id);
create policy experience_draft_owner_insert on public.experience_catalogue_drafts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy experience_draft_owner_update on public.experience_catalogue_drafts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy experience_draft_owner_delete on public.experience_catalogue_drafts for delete to authenticated using ((select auth.uid()) = owner_id);
commit;
