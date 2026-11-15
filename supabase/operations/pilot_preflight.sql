-- Read-only inventory for the development pilot. NOT proof of behavioral correctness.
-- Run in Supabase SQL Editor; share status rows only, never credentials/user data.
begin read only;
with expected(name) as (values
 ('marketplace_blocks'),('marketplace_reports'),('marketplace_messaging_access'),('marketplace_conversations'),('marketplace_messages'),('marketplace_messaging_events'),('marketplace_publication_holds'),('marketplace_report_notes'),('marketplace_report_events'),('marketplace_booking_request_access'),('marketplace_booking_requests'),('marketplace_booking_request_versions'),('marketplace_pilot_service_settings'),
 ('account_roles'),('staff_capabilities'),('profile_publication_submissions'),
 ('marketplace_blocks'),('marketplace_reports'),('marketplace_messaging_access'),('marketplace_conversations'),('marketplace_messages'),('marketplace_messaging_events'),('marketplace_publication_holds'),('marketplace_report_notes'),('marketplace_report_events'),('marketplace_booking_request_access'),('marketplace_booking_requests'),('marketplace_booking_request_versions'),('marketplace_pilot_service_settings'),
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
 ('public.get_marketplace_contact_service_status()'),('public.can_manage_messaging_pilot()'),('public.can_manage_booking_request_pilot()'),('public.can_review_marketplace_reports()'),('public.can_pause_pilot_publication()'),('public.read_marketplace_messages(uuid,uuid,bigint)'),('public.send_marketplace_text(uuid,uuid,uuid,text)'),('public.submit_marketplace_report(uuid,text,uuid,text,text)'),('public.submit_marketplace_message_report(uuid,uuid,uuid,text,text)'),('public.list_my_marketplace_blocks(uuid,uuid)'),('public.submit_booking_request(uuid,uuid,uuid,text,timestamp with time zone,timestamp with time zone,text,text,text)'),('public.change_booking_request(uuid,uuid,uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,text)'),
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
 ('public.lock_marketplace_contact_pair(uuid,uuid)',false),('public.marketplace_contact_blocked(uuid,uuid)',false),
 ('public.can_send_marketplace_text(uuid,uuid)',false),('public.can_exchange_booking_requests(uuid,uuid)',false),('public.send_marketplace_text(uuid,uuid,uuid,text)',false),('public.submit_booking_request(uuid,uuid,uuid,text,timestamp with time zone,timestamp with time zone,text,text,text)',false),
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
 when not anon_allowed and (signature like '%_internal()' or signature like 'public.can_send_%' or signature like 'public.can_exchange_%' or signature like 'public.marketplace_contact_%' or signature like 'public.lock_marketplace_%') and pg_catalog.has_function_privilege('authenticated',signature,'EXECUTE') then 'REVIEW: authenticated internal projection access'
 else 'Expected anonymous/internal execute boundary' end as execute_status
from expected order by signature;

do $$
declare is_enabled boolean;contact_switch record;
begin
 if pg_catalog.to_regclass('public.marketplace_pilot_directory_settings') is null then
  raise notice 'Directory switch: MISSING; do not activate';
 else
  execute 'select enabled from public.marketplace_pilot_directory_settings where id=$1' into is_enabled using 'directory';
  if is_enabled is null then raise notice 'Directory switch: MISSING ROW; do not activate';
  elsif is_enabled then raise notice 'Directory switch: ENABLED; review authorization and release verification';
  else raise notice 'Directory switch: OFF (expected during setup)'; end if;
 end if;
 if pg_catalog.to_regclass('public.marketplace_pilot_service_settings') is not null then
  raise notice 'Contact switch inventory follows in SQL Editor notices';
  for contact_switch in execute 'select id,enabled from public.marketplace_pilot_service_settings order by id' loop
   raise notice 'Contact switch % enabled: % (expected false during setup)',contact_switch.id,contact_switch.enabled;
  end loop;
 else raise notice 'Contact switches: MISSING; apply migration 015 before any contact activation';end if;
end;
$$;
rollback;
