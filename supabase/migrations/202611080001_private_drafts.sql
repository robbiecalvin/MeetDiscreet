-- Initial backend scope: private owner-only drafts. No publishing or paid access.
begin;

create table public.profile_drafts (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  username text not null default '' check (char_length(username) <= 80),
  adult_age integer check (adult_age >= 18),
  tagline text not null default '' check (char_length(tagline) <= 120),
  city text not null default '' check (char_length(city) <= 100),
  area text not null default '' check (char_length(area) <= 80),
  photo_index smallint not null default 2 check (photo_index between 0 and 11),
  biography text not null default '' check (char_length(biography) <= 1000),
  interests text not null default '' check (char_length(interests) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listing_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('offering', 'looking')),
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(btrim(description)) between 20 and 1600),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  area text not null default '' check (char_length(area) <= 80),
  activity text not null check (char_length(btrim(activity)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listing_drafts_owner_updated_idx on public.listing_drafts(owner_id, updated_at desc);

create function public.touch_private_draft_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := pg_catalog.now();
  new.created_at := old.created_at;
  return new;
end;
$$;
revoke all on function public.touch_private_draft_updated_at() from public, anon, authenticated;
create trigger profile_draft_updated before update on public.profile_drafts
  for each row execute function public.touch_private_draft_updated_at();
create trigger listing_draft_updated before update on public.listing_drafts
  for each row execute function public.touch_private_draft_updated_at();

alter table public.profile_drafts enable row level security;
alter table public.profile_drafts force row level security;
alter table public.listing_drafts enable row level security;
alter table public.listing_drafts force row level security;
revoke all on table public.profile_drafts, public.listing_drafts from public, anon, authenticated;
grant select, insert, update, delete on table public.profile_drafts, public.listing_drafts to authenticated;

create policy profile_draft_owner_select on public.profile_drafts for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy profile_draft_owner_insert on public.profile_drafts for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy profile_draft_owner_update on public.profile_drafts for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy profile_draft_owner_delete on public.profile_drafts for delete to authenticated
  using ((select auth.uid()) = owner_id);
create policy listing_draft_owner_select on public.listing_drafts for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy listing_draft_owner_insert on public.listing_drafts for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy listing_draft_owner_update on public.listing_drafts for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy listing_draft_owner_delete on public.listing_drafts for delete to authenticated
  using ((select auth.uid()) = owner_id);
commit;
