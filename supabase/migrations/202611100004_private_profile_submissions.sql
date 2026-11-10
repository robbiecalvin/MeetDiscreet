-- Private publication preparation only. No staff/public access or publishing grant.
begin;
create table public.profile_publication_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_updated_at timestamptz not null,
  public_fields jsonb not null check (jsonb_typeof(public_fields)='object'),
  submitted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check (withdrawn_at is null or withdrawn_at >= submitted_at)
);
create unique index profile_publication_one_pending on public.profile_publication_submissions(owner_id) where withdrawn_at is null;
alter table public.profile_publication_submissions enable row level security;
alter table public.profile_publication_submissions force row level security;
revoke all on public.profile_publication_submissions from public, anon, authenticated;
grant select on public.profile_publication_submissions to authenticated;
create policy profile_publication_owner_read on public.profile_publication_submissions for select to authenticated using(owner_id=auth.uid());

create function public.submit_private_profile_copy(p_expected_owner uuid,p_source_updated_at timestamptz)
returns public.profile_publication_submissions language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); profile public.profile_drafts; result public.profile_publication_submissions;
begin
  if actor is null or p_expected_owner is distinct from actor then raise exception 'Account changed or not authenticated'; end if;
  -- Serialize with role revocation while checking current authoritative membership.
  perform 1 from public.account_roles where user_id=actor and role in ('user','provider') order by role for share;
  if not exists(select 1 from public.account_roles where user_id=actor and role='user') or not exists(select 1 from public.account_roles where user_id=actor and role='provider') then raise exception 'Current User and Provider membership required'; end if;
  select * into profile from public.profile_drafts where owner_id=actor for update;
  if not found then raise exception 'Saved profile required'; end if;
  if p_source_updated_at is null or profile.updated_at is distinct from p_source_updated_at then raise exception 'Saved profile changed; review again'; end if;
  if btrim(profile.username)='' or profile.adult_age is null or profile.adult_age<18 then raise exception 'Saved username and adult age required'; end if;
  insert into public.profile_publication_submissions(owner_id,source_updated_at,public_fields)
  values(actor,profile.updated_at,jsonb_build_object('display_name',profile.display_name,'username',profile.username,'adult_age',profile.adult_age,'tagline',profile.tagline,'city',profile.city,'area',profile.area,'photo_index',profile.photo_index)) returning * into result;
  return result;
end;
$$;
create function public.withdraw_private_profile_copy(p_expected_owner uuid,p_submission uuid)
returns public.profile_publication_submissions language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result public.profile_publication_submissions;
begin
  if actor is null or p_expected_owner is distinct from actor then raise exception 'Account changed or not authenticated'; end if;
  -- Owners can withdraw even after Provider membership was revoked.
  update public.profile_publication_submissions set withdrawn_at=clock_timestamp()
    where id=p_submission and owner_id=actor and withdrawn_at is null returning * into result;
  if not found then raise exception 'Pending private submission unavailable'; end if;
  return result;
end;
$$;
revoke all on function public.submit_private_profile_copy(uuid,timestamptz) from public,anon,authenticated,service_role;
revoke all on function public.withdraw_private_profile_copy(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.submit_private_profile_copy(uuid,timestamptz) to authenticated;
grant execute on function public.withdraw_private_profile_copy(uuid,uuid) to authenticated;
commit;
