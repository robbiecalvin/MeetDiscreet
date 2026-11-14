-- Private readiness only. No plans granted, public reads or activation RPC.
begin;
create table public.marketplace_publishing_eligibility (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 valid_from timestamptz not null,
 valid_until timestamptz not null,
 revoked_at timestamptz,
 source_reference text not null check(char_length(btrim(source_reference)) between 1 and 240),
 check(valid_until>valid_from)
);
alter table public.marketplace_publishing_eligibility enable row level security;
alter table public.marketplace_publishing_eligibility force row level security;
revoke all on public.marketplace_publishing_eligibility from public,anon,authenticated,service_role;
-- Trusted integration only; no browser/staff-panel path may assign eligibility.
grant select,insert,update,delete on public.marketplace_publishing_eligibility to service_role;
create function public.get_own_marketplace_publishing_readiness(p_expected_owner uuid)
returns table(user_member boolean,provider_member boolean,publishing_eligible boolean,eligibility_until timestamptz,
 approved_profile_copies bigint,approved_offering_copies bigint,approved_looking_copies bigint,public_activation_connected boolean)
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
 false;
end;
$$;
revoke all on function public.get_own_marketplace_publishing_readiness(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_own_marketplace_publishing_readiness(uuid) to authenticated;
commit;
