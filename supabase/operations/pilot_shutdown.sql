-- Explicit operational shutdown only. Does not delete copies, selections or eligibility.
-- Requires trusted SQL Editor/database authority; never place credentials in browser code.
begin;
update public.marketplace_pilot_directory_settings set enabled=false where id='directory';
select id,enabled from public.marketplace_pilot_directory_settings where id='directory';
commit;
