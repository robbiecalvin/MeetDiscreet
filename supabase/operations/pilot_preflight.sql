-- Read-only inventory for the development pilot. NOT proof of behavioral correctness.
-- Run in Supabase SQL Editor; share status rows only, never credentials/user data.
begin read only;
with expected(name) as (values
 ('account_roles'),('staff_capabilities'),('profile_publication_submissions'),
 ('profile_editorial_approvals'),('listing_publication_submissions'),
 ('listing_editorial_approvals'),('marketplace_publishing_eligibility'),
 ('marketplace_pilot_events'),('marketplace_visibility_selections'),
 ('marketplace_pilot_directory_settings'),('listing_review_events')
)
select e.name as resource,
 case when c.oid is null then 'MISSING'
 when not c.relrowsecurity or not c.relforcerowsecurity then 'REVIEW: RLS not enabled/forced'
 else 'PRESENT: RLS enabled/forced' end as schema_status
from expected e left join pg_catalog.pg_namespace n on n.nspname='public'
left join pg_catalog.pg_class c on c.relnamespace=n.oid and c.relname=e.name and c.relkind='r'
order by e.name;

with expected(signature) as (values
 ('public.can_approve_marketplace_publications()'),
 ('public.approve_profile_editorial_copy(uuid,uuid)'),
 ('public.can_review_listing_publications()'),
 ('public.list_listing_publications_for_review(uuid,timestamp with time zone,uuid)'),
 ('public.get_listing_publication_for_review(uuid,uuid)'),
 ('public.approve_listing_editorial_copy(uuid,uuid)'),
 ('public.submit_private_listing_copy(uuid,uuid,timestamp with time zone)'),
 ('public.withdraw_private_listing_copy(uuid,uuid)'),
 ('public.get_own_marketplace_publishing_readiness(uuid)'),
 ('public.can_manage_marketplace_pilot()'),
 ('public.get_pilot_publishing_eligibility(uuid,uuid)'),
 ('public.set_pilot_publishing_eligibility(uuid,uuid,uuid,timestamp with time zone,boolean)'),
 ('public.get_own_pilot_visibility(uuid,text,uuid)'),
 ('public.set_own_pilot_visibility(uuid,text,uuid,uuid,boolean)'),
 ('public.get_pilot_directory_status()'),
 ('public.list_pilot_public_profiles(uuid)'),
 ('public.list_pilot_public_offerings(uuid)'),
 ('public.pilot_directory_profiles_internal()'),
 ('public.pilot_directory_offerings_internal()'),
 ('public.get_own_pilot_visibility_diagnostics(uuid,text,uuid)')
)
select signature,case when pg_catalog.to_regprocedure(signature) is null then 'MISSING' else 'PRESENT' end as function_status
from expected order by signature;

-- Check both direct and inherited privileges, including grants to PUBLIC.
with expected(name) as (values
 ('profile_editorial_approvals'),('listing_publication_submissions'),('listing_editorial_approvals'),
 ('marketplace_publishing_eligibility'),('marketplace_pilot_events'),
 ('marketplace_visibility_selections'),('marketplace_pilot_directory_settings'),('listing_review_events')
), roles(name) as (values ('anon'),('authenticated'))
select e.name as resource,r.name as browser_role,
 case when pg_catalog.to_regclass('public.'||e.name) is null then 'MISSING'
 when pg_catalog.has_table_privilege(r.name,'public.'||e.name,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
 or pg_catalog.has_any_column_privilege(r.name,'public.'||e.name,'INSERT,UPDATE,REFERENCES') then 'REVIEW: unexpected direct write privilege'
 else 'No direct browser writes' end as write_status,
 case when pg_catalog.to_regclass('public.'||e.name) is null then 'MISSING'
 when r.name='anon' and (pg_catalog.has_table_privilege(r.name,'public.'||e.name,'SELECT') or pg_catalog.has_any_column_privilege(r.name,'public.'||e.name,'SELECT')) then 'REVIEW: anonymous private-table reads'
 else 'Read privileges require separate RLS/column review' end as read_status
from expected e cross join roles r order by e.name,r.name;

with expected(signature,anon_allowed) as (values
 ('public.pilot_directory_profiles_internal()',false),
 ('public.pilot_directory_offerings_internal()',false),
 ('public.get_own_pilot_visibility_diagnostics(uuid,text,uuid)',false),
 ('public.set_pilot_publishing_eligibility(uuid,uuid,uuid,timestamp with time zone,boolean)',false),
 ('public.set_own_pilot_visibility(uuid,text,uuid,uuid,boolean)',false),
 ('public.get_pilot_directory_status()',true),
 ('public.list_pilot_public_profiles(uuid)',true),
 ('public.list_pilot_public_offerings(uuid)',true)
)
select signature,
 case when pg_catalog.to_regprocedure(signature) is null then 'MISSING'
 when pg_catalog.has_function_privilege('anon',signature,'EXECUTE') is distinct from anon_allowed then 'REVIEW: unexpected anonymous execute privilege'
 when not anon_allowed and signature like '%_internal()' and pg_catalog.has_function_privilege('authenticated',signature,'EXECUTE') then 'REVIEW: authenticated internal projection access'
 else 'Expected anonymous/internal execute boundary' end as execute_status
from expected order by signature;

do $$
declare is_enabled boolean;
begin
 if pg_catalog.to_regclass('public.marketplace_pilot_directory_settings') is null then
  raise notice 'Directory switch: MISSING; do not activate';
 else
  execute 'select enabled from public.marketplace_pilot_directory_settings where id=$1' into is_enabled using 'directory';
  if is_enabled is null then raise notice 'Directory switch: MISSING ROW; do not activate';
  elsif is_enabled then raise notice 'Directory switch: ENABLED; review authorization and release verification';
  else raise notice 'Directory switch: OFF (expected during setup)'; end if;
 end if;
end;
$$;
rollback;
