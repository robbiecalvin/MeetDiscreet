begin;
-- Private User introductions, separate from companion/provider presentations.
create table public.user_profile_drafts (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username text not null default '' check (char_length(username) <= 80),
  adult_age integer check (adult_age >= 18),
  display_name text not null default '' check (char_length(display_name) <= 80),
  city text not null default '' check (char_length(city) <= 100),
  prefer_not_to_say boolean not null default true,
  gender_description text not null default '' check (char_length(gender_description) <= 80),
  interests text not null default '' check (char_length(interests) <= 240),
  languages text not null default '' check (char_length(languages) <= 240),
  looking_for text not null default '' check (char_length(looking_for) <= 1000),
  enjoys text not null default '' check (char_length(enjoys) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((prefer_not_to_say and gender_description = '') or (not prefer_not_to_say and char_length(btrim(gender_description)) > 0))
);
create trigger user_profile_draft_updated before update on public.user_profile_drafts
  for each row execute function public.touch_private_draft_updated_at();
alter table public.user_profile_drafts enable row level security;
alter table public.user_profile_drafts force row level security;
revoke all on public.user_profile_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.user_profile_drafts to authenticated;
create policy user_profile_draft_owner_select on public.user_profile_drafts for select to authenticated using ((select auth.uid()) = owner_id);
create policy user_profile_draft_owner_insert on public.user_profile_drafts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy user_profile_draft_owner_update on public.user_profile_drafts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy user_profile_draft_owner_delete on public.user_profile_drafts for delete to authenticated using ((select auth.uid()) = owner_id);
commit;
