-- Owner selections only. Activation/public projections remain disconnected.
begin;
create table public.marketplace_visibility_selections (
 owner_id uuid not null references auth.users(id) on delete cascade,
 resource_kind text not null check(resource_kind in ('profile','offering')),
 resource_id uuid not null,
 approved_submission_id uuid not null,
 requested_visible boolean not null default false,
 revision uuid not null default gen_random_uuid(),
 updated_at timestamptz not null default clock_timestamp(),
 primary key(owner_id,resource_kind,resource_id)
);
alter table public.marketplace_visibility_selections enable row level security;
alter table public.marketplace_visibility_selections force row level security;
revoke all on public.marketplace_visibility_selections from public,anon,authenticated,service_role;
-- All reads and writes validate the referenced approval through owner-scoped RPCs.
create function public.get_own_pilot_visibility(p_expected_owner uuid,p_kind text,p_approved_submission uuid)
returns table(resource_id uuid,selected_submission_id uuid,requested_visible boolean,revision uuid)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();target uuid;
begin
 if actor is null or p_expected_owner is distinct from actor then raise exception 'Owner changed'; end if;
 if p_kind='profile' then
  select a.owner_id into target from public.profile_editorial_approvals a where a.submission_id=p_approved_submission and a.owner_id=actor;
 elsif p_kind='offering' then
  select s.source_listing_id into target from public.listing_editorial_approvals a join public.listing_publication_submissions s on s.id=a.submission_id
  where a.submission_id=p_approved_submission and a.owner_id=actor and a.kind='offering';
 else raise exception 'Unsupported visibility kind'; end if;
 if target is null then raise exception 'Owned editorial approval required'; end if;
 return query select target,v.approved_submission_id,coalesce(v.requested_visible,false),v.revision
 from (select 1) seed left join public.marketplace_visibility_selections v on v.owner_id=actor and v.resource_kind=p_kind and v.resource_id=target;
end;
$$;
create function public.set_own_pilot_visibility(p_expected_owner uuid,p_kind text,p_approved_submission uuid,p_expected_revision uuid,p_visible boolean)
returns table(resource_id uuid,selected_submission_id uuid,requested_visible boolean,revision uuid)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();target uuid;existing public.marketplace_visibility_selections;result public.marketplace_visibility_selections;eligibility public.marketplace_publishing_eligibility;
begin
 if actor is null or p_expected_owner is distinct from actor or p_visible is null then raise exception 'Owner changed or missing visibility action'; end if;
 if p_kind='profile' then
  select a.owner_id into target from public.profile_editorial_approvals a where a.submission_id=p_approved_submission and a.owner_id=actor for share;
 elsif p_kind='offering' then
  select s.source_listing_id into target from public.listing_editorial_approvals a join public.listing_publication_submissions s on s.id=a.submission_id
  where a.submission_id=p_approved_submission and a.owner_id=actor and a.kind='offering' for share of a,s;
 else raise exception 'Unsupported visibility kind'; end if;
 if target is null then raise exception 'Owned editorial approval required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-visibility:'||actor::text||':'||p_kind||':'||target::text,0));
 select * into existing from public.marketplace_visibility_selections v where v.owner_id=actor and v.resource_kind=p_kind and v.resource_id=target for update;
 if existing.revision is distinct from p_expected_revision then raise exception 'Visibility changed; inspect again'; end if;
 if p_visible then
  perform 1 from public.account_roles where user_id=actor and role in ('user','provider') order by role for share;
  if not exists(select 1 from public.account_roles where user_id=actor and role='user') or not exists(select 1 from public.account_roles where user_id=actor and role='provider') then raise exception 'Current User and Provider required'; end if;
  select * into eligibility from public.marketplace_publishing_eligibility e where e.owner_id=actor for share;
  if not found or eligibility.revoked_at is not null or eligibility.valid_from>clock_timestamp() or eligibility.valid_until<=clock_timestamp() then raise exception 'Current publishing eligibility required'; end if;
 elsif existing.owner_id is null then raise exception 'No selected version to hide'; end if;
 if existing.owner_id is null then
  insert into public.marketplace_visibility_selections(owner_id,resource_kind,resource_id,approved_submission_id,requested_visible)
  values(actor,p_kind,target,p_approved_submission,p_visible) returning * into result;
 else
  update public.marketplace_visibility_selections v set approved_submission_id=case when p_visible then p_approved_submission else v.approved_submission_id end,
  requested_visible=p_visible,revision=gen_random_uuid(),updated_at=clock_timestamp()
  where v.owner_id=actor and v.resource_kind=p_kind and v.resource_id=target returning * into result;
 end if;
 return query select result.resource_id,result.approved_submission_id,result.requested_visible,result.revision;
end;
$$;
revoke all on function public.get_own_pilot_visibility(uuid,text,uuid),public.set_own_pilot_visibility(uuid,text,uuid,uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function public.get_own_pilot_visibility(uuid,text,uuid),public.set_own_pilot_visibility(uuid,text,uuid,uuid,boolean) to authenticated;
commit;
