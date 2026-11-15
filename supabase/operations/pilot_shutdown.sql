-- Explicit operational shutdown. No deletion; participant history/reporting remains.
-- Trusted SQL Editor only. Handles partial migration setup without reopening anything.
begin;
do $$
begin
 if pg_catalog.to_regclass('public.marketplace_pilot_directory_settings') is not null then
  execute 'update public.marketplace_pilot_directory_settings set enabled=false where id=$1' using 'directory';
  raise notice 'Pilot directory switch set OFF (if present)';
 else raise notice 'Pilot directory table absent; no directory activation to change';end if;
 if pg_catalog.to_regclass('public.marketplace_pilot_service_settings') is not null then
  execute 'update public.marketplace_pilot_service_settings set enabled=false where id in ($1,$2)' using 'text_messaging','booking_requests';
  raise notice 'New text sends and new booking requests/revisions set OFF (if present); history remains readable';
 else raise notice 'Contact service switches absent; inspect migration state before further operations';end if;
end;
$$;
commit;
