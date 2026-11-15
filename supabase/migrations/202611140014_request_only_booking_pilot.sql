-- Request/revision discussion only: no reservations, confirmation, money or fees.
begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback','marketplace_publication_approval','listing_publication_review','marketplace_pilot_management','marketplace_messaging_pilot_management','marketplace_report_review','marketplace_publication_moderation','marketplace_booking_pilot_management'));
alter table public.marketplace_messaging_events add column service text not null default 'text' check(service in ('text','booking_requests'));
create table public.marketplace_booking_request_access (
 id uuid not null default gen_random_uuid() unique,
 member_id uuid not null references auth.users(id) on delete cascade,provider_id uuid not null references auth.users(id) on delete cascade,
 valid_until timestamptz not null,revoked_at timestamptz,revision uuid not null default gen_random_uuid(),
 primary key(member_id,provider_id),check(member_id<>provider_id)
);
create table public.marketplace_booking_requests (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references auth.users(id) on delete cascade,provider_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null,state text not null default 'requested' check(state in ('requested','revision_proposed','declined','withdrawn')),
 current_version integer not null default 1 check(current_version>0),revision uuid not null default gen_random_uuid(),
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 check(member_id<>provider_id),unique(member_id,client_id)
);
create table public.marketplace_booking_request_versions (
 request_id uuid not null references public.marketplace_booking_requests(id) on delete cascade,version integer not null,
 author_id uuid not null,activity text not null check(char_length(btrim(activity)) between 1 and 120),
 start_at timestamptz not null,end_at timestamptz not null,time_zone text not null,
 meeting_area text not null check(char_length(btrim(meeting_area)) between 1 and 160),notes text not null default '' check(char_length(notes)<=1000),
 created_at timestamptz not null default clock_timestamp(),
 primary key(request_id,version),check(end_at>start_at)
);
create index marketplace_booking_request_inbox on public.marketplace_booking_requests(created_at desc,id desc);
alter table public.marketplace_booking_request_access enable row level security;
alter table public.marketplace_booking_request_access force row level security;
alter table public.marketplace_booking_requests enable row level security;
alter table public.marketplace_booking_requests force row level security;
alter table public.marketplace_booking_request_versions enable row level security;
alter table public.marketplace_booking_request_versions force row level security;
revoke all on public.marketplace_booking_request_access,public.marketplace_booking_requests,public.marketplace_booking_request_versions from public,anon,authenticated,service_role;
create function public.can_manage_booking_request_pilot() returns boolean language sql stable security invoker set search_path='' as $$
 select public.has_account_role('admin') and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='marketplace_booking_pilot_management');
$$;
create function public.can_exchange_booking_requests(p_member uuid,p_provider uuid) returns boolean language sql volatile security definer set search_path='' as $$
 select exists(select 1 from public.marketplace_pilot_service_settings where id='booking_requests' and enabled)
 and exists(select 1 from public.marketplace_booking_request_access a where a.member_id=p_member and a.provider_id=p_provider and a.revoked_at is null and a.valid_until>clock_timestamp())
 and exists(select 1 from public.account_roles where user_id=p_member and role='user')
 and exists(select 1 from public.account_roles where user_id=p_provider and role='user')
 and exists(select 1 from public.account_roles where user_id=p_provider and role='provider')
 and not public.marketplace_contact_blocked(p_member,p_provider);
$$;
create function public.inspect_booking_request_pilot_pair(p_expected_actor uuid,p_member uuid,p_provider uuid)
returns table(member_id uuid,provider_id uuid,members_valid boolean,revision uuid,valid_until timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Administrator changed';end if;
 if not public.can_manage_booking_request_pilot() then raise exception 'Assigned booking request pilot scope required';end if;
 if p_member is null or p_provider is null or p_member=p_provider then raise exception 'Distinct pair required';end if;
 insert into public.marketplace_messaging_events(actor_id,member_id,provider_id,action,service) values(auth.uid(),p_member,p_provider,'access_opened','booking_requests');
 return query select p_member,p_provider,
 exists(select 1 from public.account_roles where user_id=p_member and role='user') and exists(select 1 from public.account_roles where user_id=p_provider and role='user') and exists(select 1 from public.account_roles where user_id=p_provider and role='provider'),a.revision,a.valid_until,a.revoked_at
 from (select 1) seed left join public.marketplace_booking_request_access a on a.member_id=p_member and a.provider_id=p_provider;
end;
$$;
create function public.set_booking_request_pilot_pair(p_expected_actor uuid,p_member uuid,p_provider uuid,p_expected_revision uuid,p_until timestamptz,p_revoke boolean)
returns table(revision uuid,valid_until timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();old public.marketplace_booking_request_access;result public.marketplace_booking_request_access;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Administrator changed';end if;
 if p_member is null or p_provider is null or p_member=p_provider or actor in (p_member,p_provider) or p_revoke is null then raise exception 'Independent invited pair required';end if;
 perform 1 from public.account_roles where user_id=actor and role='admin' for share;
 perform 1 from public.staff_capabilities where user_id=actor and capability='marketplace_booking_pilot_management' for share;
 if not public.can_manage_booking_request_pilot() then raise exception 'Assigned booking pilot scope required';end if;
 perform public.lock_marketplace_contact_pair(p_member,p_provider);
 select * into old from public.marketplace_booking_request_access a where a.member_id=p_member and a.provider_id=p_provider for update;
 if old.revision is distinct from p_expected_revision then raise exception 'Pair access changed';end if;
 if p_revoke then
  if old.member_id is null or old.revoked_at is not null then raise exception 'Current pair access required';end if;
  update public.marketplace_booking_request_access a set revoked_at=clock_timestamp(),revision=gen_random_uuid() where a.member_id=p_member and a.provider_id=p_provider returning * into result;
 else
  if p_until is null or not pg_catalog.isfinite(p_until) or p_until<=clock_timestamp() then raise exception 'Explicit future expiry required';end if;
  perform 1 from public.account_roles where user_id in (p_member,p_provider) and role in ('user','provider') order by user_id,role for share;
  if not exists(select 1 from public.account_roles where user_id=p_member and role='user') or not exists(select 1 from public.account_roles where user_id=p_provider and role='user') or not exists(select 1 from public.account_roles where user_id=p_provider and role='provider') then raise exception 'Current User/Provider pair required';end if;
  if old.member_id is null then insert into public.marketplace_booking_request_access(member_id,provider_id,valid_until) values(p_member,p_provider,p_until) returning * into result;
  else update public.marketplace_booking_request_access a set valid_until=p_until,revoked_at=null,revision=gen_random_uuid() where a.member_id=p_member and a.provider_id=p_provider returning * into result;end if;
 end if;
 insert into public.marketplace_messaging_events(actor_id,member_id,provider_id,action,valid_until,service) values(actor,p_member,p_provider,case when p_revoke then 'access_revoked' else 'access_granted' end,result.valid_until,'booking_requests');
 return query select result.revision,result.valid_until,result.revoked_at;
end;
$$;
create function public.list_my_booking_request_pairs(p_expected_actor uuid)
returns table(id uuid)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 return query select a.id from public.marketplace_booking_request_access a where a.member_id=auth.uid() and public.can_exchange_booking_requests(a.member_id,a.provider_id) order by a.id limit 101;
end;
$$;
create function public.list_my_booking_requests(p_expected_actor uuid,p_before_time timestamptz default null,p_before_id uuid default null)
returns table(id uuid,state text,activity text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 if (p_before_time is null)<>(p_before_id is null) then raise exception 'Incomplete cursor';end if;
 return query select r.id,r.state,v.activity,r.created_at from public.marketplace_booking_requests r join public.marketplace_booking_request_versions v on v.request_id=r.id and v.version=r.current_version
 where auth.uid() in (r.member_id,r.provider_id) and (p_before_time is null or (r.created_at,r.id)<(p_before_time,p_before_id)) order by r.created_at desc,r.id desc limit 21;
end;
$$;
create function public.read_my_booking_request(p_expected_actor uuid,p_request uuid)
returns table(id uuid,state text,revision uuid,current_version integer,am_requester boolean,can_propose boolean,versions jsonb)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 return query select r.id,r.state,r.revision,r.current_version,r.member_id=auth.uid(),r.state in ('requested','revision_proposed') and public.can_exchange_booking_requests(r.member_id,r.provider_id),
 (select coalesce(jsonb_agg(jsonb_build_object('version',v.version,'activity',v.activity,'start_at',v.start_at,'end_at',v.end_at,'time_zone',v.time_zone,'meeting_area',v.meeting_area,'notes',v.notes,'authored_by_me',v.author_id=auth.uid(),'created_at',v.created_at) order by v.version desc),'[]'::jsonb)
 from (select x.* from public.marketplace_booking_request_versions x where x.request_id=r.id order by x.version desc limit 20) v)
 from public.marketplace_booking_requests r where r.id=p_request and auth.uid() in (r.member_id,r.provider_id);
end;
$$;
create function public.submit_booking_request(p_expected_actor uuid,p_pair uuid,p_client_id uuid,p_activity text,p_start timestamptz,p_end timestamptz,p_zone text,p_area text,p_notes text)
returns table(id uuid,revision uuid)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();pair public.marketplace_booking_request_access;r public.marketplace_booking_requests;v public.marketplace_booking_request_versions;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed';end if;
 select * into pair from public.marketplace_booking_request_access where marketplace_booking_request_access.id=p_pair and member_id=actor;
 if not found then raise exception 'Invited requester pair required';end if;
 perform public.lock_marketplace_contact_pair(pair.member_id,pair.provider_id);
 select * into r from public.marketplace_booking_requests x where x.member_id=actor and x.client_id=p_client_id;
 if found then
  select * into v from public.marketplace_booking_request_versions x where x.request_id=r.id and x.version=1;
  if r.provider_id is distinct from pair.provider_id or row(v.activity,v.start_at,v.end_at,v.time_zone,v.meeting_area,v.notes) is distinct from row(btrim(p_activity),p_start,p_end,p_zone,btrim(p_area),coalesce(btrim(p_notes),'')) then raise exception 'Request ID used for different terms';end if;
  return query select r.id,r.revision;return;
 end if;
 perform 1 from public.account_roles where user_id in (pair.member_id,pair.provider_id) and role in ('user','provider') order by user_id,role for share;
 perform 1 from public.marketplace_booking_request_access a where a.id=pair.id for share;
 perform 1 from public.marketplace_pilot_service_settings where marketplace_pilot_service_settings.id='booking_requests' for share;
 if not public.can_exchange_booking_requests(pair.member_id,pair.provider_id) then raise exception 'Current booking request access required';end if;
 if p_client_id is null or p_start is null or p_end is null or not pg_catalog.isfinite(p_start) or not pg_catalog.isfinite(p_end) or p_start<=clock_timestamp() or p_end<=p_start or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_zone) then raise exception 'Valid future schedule and explicit time zone required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-request-sender:'||actor::text,0));
 if (select count(*) from public.marketplace_booking_requests x where x.member_id=actor and x.created_at>statement_timestamp()-interval '1 hour')>=10 then raise exception 'Request limit reached; retry later';end if;
 insert into public.marketplace_booking_requests(member_id,provider_id,client_id) values(actor,pair.provider_id,p_client_id) returning * into r;
 insert into public.marketplace_booking_request_versions(request_id,version,author_id,activity,start_at,end_at,time_zone,meeting_area,notes)
 values(r.id,1,actor,btrim(p_activity),p_start,p_end,p_zone,btrim(p_area),coalesce(btrim(p_notes),''));
 return query select r.id,r.revision;
end;
$$;
create function public.change_booking_request(p_expected_actor uuid,p_request uuid,p_expected_revision uuid,p_action text,p_activity text default null,p_start timestamptz default null,p_end timestamptz default null,p_zone text default null,p_area text default null,p_notes text default null)
returns table(id uuid,revision uuid,state text)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();r public.marketplace_booking_requests;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed';end if;
 select * into r from public.marketplace_booking_requests where marketplace_booking_requests.id=p_request;
 if not found or actor not in (r.member_id,r.provider_id) then raise exception 'Request membership required';end if;
 perform public.lock_marketplace_contact_pair(r.member_id,r.provider_id);
 select * into r from public.marketplace_booking_requests where marketplace_booking_requests.id=p_request for update;
 if r.revision is distinct from p_expected_revision or r.state not in ('requested','revision_proposed') then raise exception 'Request changed or already closed';end if;
 if p_action='withdraw' and actor=r.member_id then
  update public.marketplace_booking_requests x set state='withdrawn',revision=gen_random_uuid(),updated_at=clock_timestamp() where x.id=r.id;
 elsif p_action='decline' and actor=r.provider_id then
  update public.marketplace_booking_requests x set state='declined',revision=gen_random_uuid(),updated_at=clock_timestamp() where x.id=r.id;
 elsif p_action='propose' then
  perform 1 from public.account_roles where user_id in (r.member_id,r.provider_id) and role in ('user','provider') order by user_id,role for share;
  perform 1 from public.marketplace_booking_request_access a where a.member_id=r.member_id and a.provider_id=r.provider_id for share;
  perform 1 from public.marketplace_pilot_service_settings where marketplace_pilot_service_settings.id='booking_requests' for share;
  if not public.can_exchange_booking_requests(r.member_id,r.provider_id) then raise exception 'Current booking request access required';end if;
  if p_start is null or p_end is null or not pg_catalog.isfinite(p_start) or not pg_catalog.isfinite(p_end) or p_start<=clock_timestamp() or p_end<=p_start or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_zone) then raise exception 'Valid future schedule and time zone required';end if;
  if r.current_version>=100 then raise exception 'Prototype revision limit reached';end if;
  insert into public.marketplace_booking_request_versions(request_id,version,author_id,activity,start_at,end_at,time_zone,meeting_area,notes)
  values(r.id,r.current_version+1,actor,btrim(p_activity),p_start,p_end,p_zone,btrim(p_area),coalesce(btrim(p_notes),''));
  update public.marketplace_booking_requests x set state='revision_proposed',current_version=r.current_version+1,revision=gen_random_uuid(),updated_at=clock_timestamp() where x.id=r.id;
 else raise exception 'Action not permitted for this participant';end if;
 return query select x.id,x.revision,x.state from public.marketplace_booking_requests x where x.id=r.id;
end;
$$;
create function public.read_booking_request_versions(p_expected_actor uuid,p_request uuid,p_before integer)
returns table(version integer,activity text,start_at timestamptz,end_at timestamptz,time_zone text,meeting_area text,notes text,authored_by_me boolean,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 if not exists(select 1 from public.marketplace_booking_requests r where r.id=p_request and auth.uid() in (r.member_id,r.provider_id)) then raise exception 'Request membership required';end if;
 if p_before is null or p_before<1 then raise exception 'Valid version cursor required';end if;
 return query select v.version,v.activity,v.start_at,v.end_at,v.time_zone,v.meeting_area,v.notes,v.author_id=auth.uid(),v.created_at
 from public.marketplace_booking_request_versions v where v.request_id=p_request and v.version<p_before order by v.version desc limit 21;
end;
$$;
revoke all on function public.read_booking_request_versions(uuid,uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.read_booking_request_versions(uuid,uuid,integer) to authenticated;
revoke all on function public.can_manage_booking_request_pilot(),public.can_exchange_booking_requests(uuid,uuid),public.inspect_booking_request_pilot_pair(uuid,uuid,uuid),public.set_booking_request_pilot_pair(uuid,uuid,uuid,uuid,timestamptz,boolean),public.list_my_booking_request_pairs(uuid),public.list_my_booking_requests(uuid,timestamptz,uuid),public.read_my_booking_request(uuid,uuid),public.submit_booking_request(uuid,uuid,uuid,text,timestamptz,timestamptz,text,text,text),public.change_booking_request(uuid,uuid,uuid,text,text,timestamptz,timestamptz,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.can_manage_booking_request_pilot(),public.inspect_booking_request_pilot_pair(uuid,uuid,uuid),public.set_booking_request_pilot_pair(uuid,uuid,uuid,uuid,timestamptz,boolean),public.list_my_booking_request_pairs(uuid),public.list_my_booking_requests(uuid,timestamptz,uuid),public.read_my_booking_request(uuid,uuid),public.submit_booking_request(uuid,uuid,uuid,text,timestamptz,timestamptz,text,text,text),public.change_booking_request(uuid,uuid,uuid,text,text,timestamptz,timestamptz,text,text,text) to authenticated;
commit;
