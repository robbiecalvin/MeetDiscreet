-- New contact services are OFF by default; read-only history/reporting remain available.
begin;
create table if not exists public.marketplace_pilot_service_settings (
 id text primary key check(id in ('text_messaging','booking_requests')),
 enabled boolean not null default false
);
insert into public.marketplace_pilot_service_settings(id,enabled) values('text_messaging',false),('booking_requests',false) on conflict(id) do nothing;
alter table public.marketplace_pilot_service_settings enable row level security;
alter table public.marketplace_pilot_service_settings force row level security;
revoke all on public.marketplace_pilot_service_settings from public,anon,authenticated,service_role;
grant select,update on public.marketplace_pilot_service_settings to service_role;
create or replace function public.get_marketplace_contact_service_status()
returns table(text_messaging boolean,booking_requests boolean)
language sql stable security definer set search_path='' as $$
 select coalesce((select enabled from public.marketplace_pilot_service_settings where id='text_messaging'),false),
 coalesce((select enabled from public.marketplace_pilot_service_settings where id='booking_requests'),false);
$$;
create or replace function public.can_send_marketplace_text(p_member uuid,p_provider uuid) returns boolean language sql volatile security definer set search_path='' as $$
 select exists(select 1 from public.marketplace_pilot_service_settings where id='text_messaging' and enabled)
 and exists(select 1 from public.marketplace_messaging_access a where a.member_id=p_member and a.provider_id=p_provider and a.revoked_at is null and a.valid_until>clock_timestamp())
 and exists(select 1 from public.account_roles r where r.user_id=p_member and r.role='user')
 and exists(select 1 from public.account_roles r where r.user_id=p_provider and r.role='user')
 and exists(select 1 from public.account_roles r where r.user_id=p_provider and r.role='provider')
 and not public.marketplace_contact_blocked(p_member,p_provider);
$$;
create or replace function public.can_exchange_booking_requests(p_member uuid,p_provider uuid) returns boolean language sql volatile security definer set search_path='' as $$
 select exists(select 1 from public.marketplace_pilot_service_settings where id='booking_requests' and enabled)
 and exists(select 1 from public.marketplace_booking_request_access a where a.member_id=p_member and a.provider_id=p_provider and a.revoked_at is null and a.valid_until>clock_timestamp())
 and exists(select 1 from public.account_roles where user_id=p_member and role='user')
 and exists(select 1 from public.account_roles where user_id=p_provider and role='user')
 and exists(select 1 from public.account_roles where user_id=p_provider and role='provider')
 and not public.marketplace_contact_blocked(p_member,p_provider);
$$;
revoke all on function public.get_marketplace_contact_service_status() from public,anon,authenticated,service_role;
grant execute on function public.get_marketplace_contact_service_status() to authenticated;
commit;
