-- DEC-025: selected invited Providers only. No payment or public activation.
begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback','marketplace_publication_approval','listing_publication_review','marketplace_pilot_management'));
alter table public.marketplace_publishing_eligibility add column revision uuid not null default gen_random_uuid();
create function public.touch_publishing_eligibility_revision() returns trigger language plpgsql set search_path='' as $$
begin new.revision:=gen_random_uuid();return new;end;
$$;
revoke all on function public.touch_publishing_eligibility_revision() from public,anon,authenticated,service_role;
create trigger publishing_eligibility_revision before update on public.marketplace_publishing_eligibility for each row execute function public.touch_publishing_eligibility_revision();
create table public.marketplace_pilot_events (
 event_id bigint generated always as identity primary key,
 actor_id uuid not null,
 target_id uuid not null,
 action text not null check(action in ('eligibility_opened','pilot_granted','pilot_revoked')),
 valid_until timestamptz,
 revision uuid,
 occurred_at timestamptz not null default clock_timestamp()
);
alter table public.marketplace_pilot_events enable row level security;
alter table public.marketplace_pilot_events force row level security;
revoke all on public.marketplace_pilot_events from public,anon,authenticated,service_role;
grant select on public.marketplace_pilot_events to service_role;
create function public.can_manage_marketplace_pilot() returns boolean language sql stable security invoker set search_path='' as $$
 select public.has_account_role('admin') and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='marketplace_pilot_management');
$$;
create function public.get_pilot_publishing_eligibility(p_expected_actor uuid,p_target uuid)
returns table(owner_id uuid,provider_member boolean,revision uuid,pilot_record boolean,valid_until timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_expected_actor is distinct from auth.uid() then raise exception 'Administrator changed'; end if;
 if not public.can_manage_marketplace_pilot() then raise exception 'Assigned pilot management access required'; end if;
 if p_target is null then raise exception 'Target required'; end if;
 insert into public.marketplace_pilot_events(actor_id,target_id,action) values(auth.uid(),p_target,'eligibility_opened');
 return query select p_target,
 exists(select 1 from public.account_roles where user_id=p_target and role='user') and exists(select 1 from public.account_roles where user_id=p_target and role='provider'),
 e.revision,coalesce(e.source_reference='development_pilot',false),e.valid_until,e.revoked_at
 from (select 1) seed left join public.marketplace_publishing_eligibility e on e.owner_id=p_target;
end;
$$;
create function public.set_pilot_publishing_eligibility(p_expected_actor uuid,p_target uuid,p_expected_revision uuid,p_valid_until timestamptz,p_revoke boolean)
returns table(owner_id uuid,revision uuid,valid_until timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();existing public.marketplace_publishing_eligibility;result public.marketplace_publishing_eligibility;
begin
 if actor is null or p_expected_actor is distinct from actor then raise exception 'Administrator changed'; end if;
 if p_target is null or p_target=actor or p_revoke is null then raise exception 'Separate target and explicit action required'; end if;
 perform 1 from public.account_roles where user_id=actor and role='admin' for share;
 perform 1 from public.staff_capabilities where user_id=actor and capability='marketplace_pilot_management' for share;
 if not public.can_manage_marketplace_pilot() then raise exception 'Assigned pilot management access required'; end if;
 -- Serialize creation as well as updates for this target.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-pilot:'||p_target::text,0));
 select * into existing from public.marketplace_publishing_eligibility e where e.owner_id=p_target for update;
 if existing.revision is distinct from p_expected_revision then raise exception 'Eligibility changed; inspect again'; end if;
 if existing.owner_id is not null and existing.source_reference<>'development_pilot' then raise exception 'Non-pilot eligibility cannot be changed here'; end if;
 if p_revoke then
  if existing.owner_id is null or existing.revoked_at is not null then raise exception 'Current pilot record required'; end if;
  update public.marketplace_publishing_eligibility e set revoked_at=clock_timestamp() where e.owner_id=p_target returning * into result;
 else
  if p_valid_until is null or not pg_catalog.isfinite(p_valid_until) or p_valid_until<=clock_timestamp() then raise exception 'Explicit future expiry required'; end if;
  perform 1 from public.account_roles where user_id=p_target and role in ('user','provider') order by role for share;
  if not exists(select 1 from public.account_roles where user_id=p_target and role='user') or not exists(select 1 from public.account_roles where user_id=p_target and role='provider') then raise exception 'Current invited User and Provider membership required'; end if;
  if existing.owner_id is null then
   insert into public.marketplace_publishing_eligibility(owner_id,valid_from,valid_until,revoked_at,source_reference)
   values(p_target,clock_timestamp(),p_valid_until,null,'development_pilot') returning * into result;
  else
   update public.marketplace_publishing_eligibility e set valid_from=clock_timestamp(),valid_until=p_valid_until,revoked_at=null
   where e.owner_id=p_target returning * into result;
  end if;
 end if;
 insert into public.marketplace_pilot_events(actor_id,target_id,action,valid_until,revision) values(actor,p_target,case when p_revoke then 'pilot_revoked' else 'pilot_granted' end,result.valid_until,result.revision);
 return query select result.owner_id,result.revision,result.valid_until,result.revoked_at;
end;
$$;
revoke all on function public.can_manage_marketplace_pilot(),public.get_pilot_publishing_eligibility(uuid,uuid),public.set_pilot_publishing_eligibility(uuid,uuid,uuid,timestamptz,boolean) from public,anon,authenticated,service_role;
grant execute on function public.can_manage_marketplace_pilot(),public.get_pilot_publishing_eligibility(uuid,uuid),public.set_pilot_publishing_eligibility(uuid,uuid,uuid,timestamptz,boolean) to authenticated;
commit;
