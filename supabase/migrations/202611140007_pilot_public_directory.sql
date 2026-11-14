-- Text-only pilot projections. Activation defaults OFF; no data/grants are seeded.
begin;
create table public.marketplace_pilot_directory_settings (
 id text primary key check(id='directory'),
 enabled boolean not null default false
);
insert into public.marketplace_pilot_directory_settings(id,enabled) values('directory',false);
alter table public.marketplace_pilot_directory_settings enable row level security;
alter table public.marketplace_pilot_directory_settings force row level security;
revoke all on public.marketplace_pilot_directory_settings from public,anon,authenticated,service_role;
grant select,update on public.marketplace_pilot_directory_settings to service_role;
create function public.pilot_directory_profiles_internal()
returns table(owner_id uuid,id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select a.owner_id,a.submission_id,jsonb_build_object(
 'display_name',a.public_fields->'display_name','username',a.public_fields->'username','adult_age',a.public_fields->'adult_age',
 'tagline',a.public_fields->'tagline','city',a.public_fields->'city','area',a.public_fields->'area')
 from public.profile_editorial_approvals a
 join public.marketplace_visibility_selections v on v.owner_id=a.owner_id and v.resource_kind='profile' and v.resource_id=a.owner_id and v.approved_submission_id=a.submission_id and v.requested_visible
 join public.marketplace_publishing_eligibility e on e.owner_id=a.owner_id
 where exists(select 1 from public.marketplace_pilot_directory_settings s where s.id='directory' and s.enabled)
 and e.source_reference='development_pilot' and e.revoked_at is null and e.valid_from<=statement_timestamp() and e.valid_until>statement_timestamp()
 and exists(select 1 from public.account_roles r where r.user_id=a.owner_id and r.role='user')
 and exists(select 1 from public.account_roles r where r.user_id=a.owner_id and r.role='provider');
$$;
create function public.get_pilot_directory_status() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select enabled from public.marketplace_pilot_directory_settings where id='directory'),false);
$$;
create function public.list_pilot_public_profiles(p_after_id uuid default null)
returns table(id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select p.id,p.public_fields from public.pilot_directory_profiles_internal() p
 where p_after_id is null or p.id>p_after_id order by p.id limit 21;
$$;
create function public.list_pilot_public_offerings(p_after_id uuid default null)
returns table(id uuid,provider_profile_id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select a.submission_id,p.id,jsonb_build_object('title',a.recorded_fields->'title','description',a.recorded_fields->'description',
 'city',a.recorded_fields->'city','area',a.recorded_fields->'area','activity',a.recorded_fields->'activity')
 from public.listing_editorial_approvals a
 join public.listing_publication_submissions s on s.id=a.submission_id and s.owner_id=a.owner_id and s.kind='offering'
 join public.marketplace_visibility_selections v on v.owner_id=a.owner_id and v.resource_kind='offering' and v.resource_id=s.source_listing_id and v.approved_submission_id=a.submission_id and v.requested_visible
 join public.pilot_directory_profiles_internal() p on p.owner_id=a.owner_id
 where a.kind='offering' and (p_after_id is null or a.submission_id>p_after_id)
 -- The pilot supports only the single included Offering. Multiple selections fail closed.
 and (select count(*) from public.marketplace_visibility_selections capacity where capacity.owner_id=a.owner_id and capacity.resource_kind='offering' and capacity.requested_visible)=1
 order by a.submission_id limit 21;
$$;
drop function public.get_own_marketplace_publishing_readiness(uuid);
create function public.get_own_marketplace_publishing_readiness(p_expected_owner uuid)
returns table(user_member boolean,provider_member boolean,publishing_eligible boolean,eligibility_until timestamptz,
 approved_profile_copies bigint,approved_offering_copies bigint,approved_looking_copies bigint,public_activation_connected boolean,public_activation_enabled boolean)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or p_expected_owner is distinct from actor then raise exception 'Owner changed or not authenticated'; end if;
 return query select
 exists(select 1 from public.account_roles where user_id=actor and role='user'),
 exists(select 1 from public.account_roles where user_id=actor and role='provider'),
 exists(select 1 from public.marketplace_publishing_eligibility e where e.owner_id=actor and e.revoked_at is null and e.valid_from<=statement_timestamp() and e.valid_until>statement_timestamp()),
 (select e.valid_until from public.marketplace_publishing_eligibility e where e.owner_id=actor and e.revoked_at is null and e.valid_from<=statement_timestamp() and e.valid_until>statement_timestamp()),
 (select count(*) from public.profile_editorial_approvals a where a.owner_id=actor),
 (select count(*) from public.listing_editorial_approvals a where a.owner_id=actor and a.kind='offering'),
 (select count(*) from public.listing_editorial_approvals a where a.owner_id=actor and a.kind='looking'),
 true,coalesce((select enabled from public.marketplace_pilot_directory_settings where id='directory'),false);
end;
$$;
revoke all on function public.get_own_marketplace_publishing_readiness(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_own_marketplace_publishing_readiness(uuid) to authenticated;
revoke all on function public.pilot_directory_profiles_internal(),public.get_pilot_directory_status(),public.list_pilot_public_profiles(uuid),public.list_pilot_public_offerings(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_pilot_directory_status(),public.list_pilot_public_profiles(uuid),public.list_pilot_public_offerings(uuid) to anon,authenticated;
commit;
