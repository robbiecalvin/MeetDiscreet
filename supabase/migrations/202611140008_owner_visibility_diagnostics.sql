-- Owner-only diagnostics reuse the exact public read predicates; no activation.
begin;
create function public.pilot_directory_offerings_internal()
returns table(owner_id uuid,id uuid,provider_profile_id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select a.owner_id,a.submission_id,p.id,jsonb_build_object('title',a.recorded_fields->'title','description',a.recorded_fields->'description',
 'city',a.recorded_fields->'city','area',a.recorded_fields->'area','activity',a.recorded_fields->'activity')
 from public.listing_editorial_approvals a
 join public.listing_publication_submissions s on s.id=a.submission_id and s.owner_id=a.owner_id and s.kind='offering'
 join public.marketplace_visibility_selections v on v.owner_id=a.owner_id and v.resource_kind='offering' and v.resource_id=s.source_listing_id and v.approved_submission_id=a.submission_id and v.requested_visible
 join public.pilot_directory_profiles_internal() p on p.owner_id=a.owner_id
 where a.kind='offering'
 -- The pilot supports only the single included Offering. Multiple selections fail closed.
 and (select count(*) from public.marketplace_visibility_selections capacity where capacity.owner_id=a.owner_id and capacity.resource_kind='offering' and capacity.requested_visible)=1
;
$$;
create or replace function public.list_pilot_public_offerings(p_after_id uuid default null)
returns table(id uuid,provider_profile_id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select o.id,o.provider_profile_id,o.public_fields from public.pilot_directory_offerings_internal() o
 where p_after_id is null or o.id>p_after_id order by o.id limit 21;
$$;
create function public.get_own_pilot_visibility_diagnostics(p_expected_owner uuid,p_kind text,p_approved_submission uuid)
returns table(directory_enabled boolean,user_member boolean,provider_member boolean,pilot_eligible boolean,
 copy_selected boolean,selection_visible boolean,profile_visible boolean,offering_selection_count bigint,visible_now boolean)
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
 return query select public.get_pilot_directory_status(),
 exists(select 1 from public.account_roles r where r.user_id=actor and r.role='user'),
 exists(select 1 from public.account_roles r where r.user_id=actor and r.role='provider'),
 exists(select 1 from public.marketplace_publishing_eligibility e where e.owner_id=actor and e.source_reference='development_pilot' and e.revoked_at is null and e.valid_from<=statement_timestamp() and e.valid_until>statement_timestamp()),
 coalesce(v.approved_submission_id=p_approved_submission,false),coalesce(v.requested_visible,false),
 exists(select 1 from public.pilot_directory_profiles_internal() p where p.owner_id=actor),
 (select count(*) from public.marketplace_visibility_selections capacity where capacity.owner_id=actor and capacity.resource_kind='offering' and capacity.requested_visible),
 case when p_kind='profile' then exists(select 1 from public.pilot_directory_profiles_internal() p where p.id=p_approved_submission and p.owner_id=actor)
 else exists(select 1 from public.pilot_directory_offerings_internal() o where o.id=p_approved_submission and o.owner_id=actor) end
 from (select 1) seed left join public.marketplace_visibility_selections v on v.owner_id=actor and v.resource_kind=p_kind and v.resource_id=target;
end;
$$;
revoke all on function public.pilot_directory_offerings_internal(),public.get_own_pilot_visibility_diagnostics(uuid,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_own_pilot_visibility_diagnostics(uuid,text,uuid) to authenticated;
commit;
