begin;
alter table public.marketplace_reports drop constraint marketplace_reports_target_kind_check;
alter table public.marketplace_reports add constraint marketplace_reports_target_kind_check check(target_kind in ('profile','offering','message'));
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback','marketplace_publication_approval','listing_publication_review','marketplace_pilot_management','marketplace_messaging_pilot_management','marketplace_report_review','marketplace_publication_moderation'));
create table public.marketplace_publication_holds (
 owner_id uuid not null references auth.users(id) on delete cascade,
 resource_kind text not null check(resource_kind in ('profile','offering')),resource_id uuid not null,
 paused boolean not null default true,revision uuid not null default gen_random_uuid(),
 primary key(owner_id,resource_kind,resource_id)
);
create table public.marketplace_report_notes (
 id bigint generated always as identity primary key,report_id uuid not null references public.marketplace_reports(id) on delete cascade,
 actor_id uuid not null,note text not null check(char_length(btrim(note)) between 1 and 1000),created_at timestamptz not null default clock_timestamp()
);
create table public.marketplace_report_events (
 id bigint generated always as identity primary key,report_id uuid,actor_id uuid not null,
 action text not null check(action in ('queue_opened','report_opened','state_changed','publication_paused','publication_resumed')),
 created_at timestamptz not null default clock_timestamp()
);
alter table public.marketplace_publication_holds enable row level security;
alter table public.marketplace_publication_holds force row level security;
alter table public.marketplace_report_notes enable row level security;
alter table public.marketplace_report_notes force row level security;
alter table public.marketplace_report_events enable row level security;
alter table public.marketplace_report_events force row level security;
revoke all on public.marketplace_publication_holds,public.marketplace_report_notes,public.marketplace_report_events from public,anon,authenticated,service_role;
grant select on public.marketplace_report_events to service_role;
create function public.can_review_marketplace_reports() returns boolean language sql stable security invoker set search_path='' as $$
 select (public.has_account_role('admin') or public.has_account_role('moderator')) and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='marketplace_report_review');
$$;
create function public.can_pause_pilot_publication() returns boolean language sql stable security invoker set search_path='' as $$
 select public.can_review_marketplace_reports() and public.has_account_role('admin') and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='marketplace_publication_moderation');
$$;
create function public.list_marketplace_reports_for_review(p_expected_actor uuid,p_state text default 'open',p_after_time timestamptz default null,p_after_id uuid default null)
returns table(id uuid,target_kind text,category text,state text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Reviewer changed';end if;
 if not public.can_review_marketplace_reports() then raise exception 'Report review scope required';end if;
 if p_state is null or p_state not in ('open','reviewing','closed') or (p_after_time is null)<>(p_after_id is null) then raise exception 'Invalid state/cursor';end if;
 -- Queue events have no report ID and never copy note/report text.
 insert into public.marketplace_report_events(report_id,actor_id,action) values(null,auth.uid(),'queue_opened');
 return query select r.id,r.target_kind,r.category,r.state,r.created_at from public.marketplace_reports r where r.state=p_state and (p_after_time is null or (r.created_at,r.id)>(p_after_time,p_after_id)) order by r.created_at,r.id limit 21;
end;
$$;
create function public.get_marketplace_report_for_review(p_expected_actor uuid,p_report uuid)
returns table(id uuid,target_kind text,category text,details text,public_snapshot jsonb,state text,created_at timestamptz,revision uuid,publication_paused boolean,hold_revision uuid,notes jsonb)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Reviewer changed';end if;
 if not public.can_review_marketplace_reports() then raise exception 'Report review scope required';end if;
 return query select r.id,r.target_kind,r.category,r.details,r.public_snapshot,r.state,r.created_at,r.revision,coalesce(h.paused,false),h.revision,
 coalesce((select jsonb_agg(jsonb_build_object('note',n.note,'created_at',n.created_at) order by n.created_at desc) from (select x.note,x.created_at from public.marketplace_report_notes x where x.report_id=r.id order by x.created_at desc,x.id desc limit 10) n),'[]'::jsonb)
 from public.marketplace_reports r left join public.marketplace_publication_holds h on h.owner_id=r.target_owner_id and h.resource_kind=r.target_kind and h.resource_id=r.target_resource_id where r.id=p_report;
 insert into public.marketplace_report_events(report_id,actor_id,action) values(p_report,auth.uid(),'report_opened');
end;
$$;
create function public.update_marketplace_report(p_expected_actor uuid,p_report uuid,p_expected_revision uuid,p_state text,p_note text,p_pause boolean default null,p_expected_hold_revision uuid default null)
returns table(id uuid,revision uuid,state text)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();r public.marketplace_reports;h public.marketplace_publication_holds;clean text;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Reviewer changed';end if;
 perform 1 from public.account_roles where user_id=actor and role in ('moderator','admin') order by role for share;
 perform 1 from public.staff_capabilities where user_id=actor and capability in ('marketplace_report_review','marketplace_publication_moderation') order by capability for share;
 if not public.can_review_marketplace_reports() then raise exception 'Report review scope required';end if;
 if p_state is null or p_state not in ('open','reviewing','closed') then raise exception 'Invalid report state';end if;
 clean:=btrim(p_note);if clean is null or char_length(clean)<1 or char_length(clean)>1000 then raise exception 'A staff note of 1 to 1000 characters is required';end if;
 select * into r from public.marketplace_reports where marketplace_reports.id=p_report for update;
 if not found or r.revision is distinct from p_expected_revision then raise exception 'Report changed; inspect again';end if;
 if r.target_owner_id=actor or r.reporter_id=actor then raise exception 'Independent report reviewer required';end if;
 if p_pause is not null then
  if r.target_kind='message' then raise exception 'Message evidence cannot change publication visibility';end if;
  if not public.can_pause_pilot_publication() then raise exception 'Administrator publication moderation scope required';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-hold:'||r.target_owner_id::text||':'||r.target_kind||':'||r.target_resource_id::text,0));
  select * into h from public.marketplace_publication_holds x where x.owner_id=r.target_owner_id and x.resource_kind=r.target_kind and x.resource_id=r.target_resource_id for update;
  if h.revision is distinct from p_expected_hold_revision then raise exception 'Publication pause changed; inspect again';end if;
  if h.owner_id is null then insert into public.marketplace_publication_holds(owner_id,resource_kind,resource_id,paused) values(r.target_owner_id,r.target_kind,r.target_resource_id,p_pause);
  else update public.marketplace_publication_holds x set paused=p_pause,revision=gen_random_uuid() where x.owner_id=r.target_owner_id and x.resource_kind=r.target_kind and x.resource_id=r.target_resource_id;end if;
 end if;
 insert into public.marketplace_report_notes(report_id,actor_id,note) values(r.id,actor,clean);
 insert into public.marketplace_report_events(report_id,actor_id,action) values(r.id,actor,case when p_pause is null then 'state_changed' when p_pause then 'publication_paused' else 'publication_resumed' end);
 return query update public.marketplace_reports x set state=p_state,updated_at=clock_timestamp(),revision=gen_random_uuid() where x.id=r.id returning x.id,x.revision,x.state;
end;
$$;
revoke all on function public.can_review_marketplace_reports(),public.can_pause_pilot_publication(),public.list_marketplace_reports_for_review(uuid,text,timestamptz,uuid),public.get_marketplace_report_for_review(uuid,uuid),public.update_marketplace_report(uuid,uuid,uuid,text,text,boolean,uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_review_marketplace_reports(),public.can_pause_pilot_publication(),public.list_marketplace_reports_for_review(uuid,text,timestamptz,uuid),public.get_marketplace_report_for_review(uuid,uuid),public.update_marketplace_report(uuid,uuid,uuid,text,text,boolean,uuid) to authenticated;
create or replace function public.pilot_directory_profiles_internal()
returns table(owner_id uuid,id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select a.owner_id,a.submission_id,jsonb_build_object(
 'display_name',a.public_fields->'display_name','username',a.public_fields->'username','adult_age',a.public_fields->'adult_age',
 'tagline',a.public_fields->'tagline','city',a.public_fields->'city','area',a.public_fields->'area')
 from public.profile_editorial_approvals a
 join public.marketplace_visibility_selections v on v.owner_id=a.owner_id and v.resource_kind='profile' and v.resource_id=a.owner_id and v.approved_submission_id=a.submission_id and v.requested_visible
 join public.marketplace_publishing_eligibility e on e.owner_id=a.owner_id
 where exists(select 1 from public.marketplace_pilot_directory_settings s where s.id='directory' and s.enabled)
 and not exists(select 1 from public.marketplace_publication_holds h where h.owner_id=a.owner_id and h.resource_kind='profile' and h.resource_id=a.owner_id and h.paused)
 and e.source_reference='development_pilot' and e.revoked_at is null and e.valid_from<=statement_timestamp() and e.valid_until>statement_timestamp()
 and exists(select 1 from public.account_roles r where r.user_id=a.owner_id and r.role='user')
 and exists(select 1 from public.account_roles r where r.user_id=a.owner_id and r.role='provider');
$$;
create or replace function public.pilot_directory_offerings_internal()
returns table(owner_id uuid,id uuid,provider_profile_id uuid,public_fields jsonb)
language sql stable security definer set search_path='' as $$
 select a.owner_id,a.submission_id,p.id,jsonb_build_object('title',a.recorded_fields->'title','description',a.recorded_fields->'description',
 'city',a.recorded_fields->'city','area',a.recorded_fields->'area','activity',a.recorded_fields->'activity')
 from public.listing_editorial_approvals a
 join public.listing_publication_submissions s on s.id=a.submission_id and s.owner_id=a.owner_id and s.kind='offering'
 join public.marketplace_visibility_selections v on v.owner_id=a.owner_id and v.resource_kind='offering' and v.resource_id=s.source_listing_id and v.approved_submission_id=a.submission_id and v.requested_visible
 join public.pilot_directory_profiles_internal() p on p.owner_id=a.owner_id
 where a.kind='offering' and not exists(select 1 from public.marketplace_publication_holds h where h.owner_id=a.owner_id and h.resource_kind='offering' and h.resource_id=s.source_listing_id and h.paused)
 -- The pilot supports only the single included Offering. Multiple selections fail closed.
 and (select count(*) from public.marketplace_visibility_selections capacity where capacity.owner_id=a.owner_id and capacity.resource_kind='offering' and capacity.requested_visible)=1
;
$$;
drop function public.get_own_pilot_visibility_diagnostics(uuid,text,uuid);
create function public.get_own_pilot_visibility_diagnostics(p_expected_owner uuid,p_kind text,p_approved_submission uuid)
returns table(directory_enabled boolean,user_member boolean,provider_member boolean,pilot_eligible boolean,
 copy_selected boolean,selection_visible boolean,profile_visible boolean,offering_selection_count bigint,visible_now boolean,moderation_paused boolean)
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
 else exists(select 1 from public.pilot_directory_offerings_internal() o where o.id=p_approved_submission and o.owner_id=actor) end,
 exists(select 1 from public.marketplace_publication_holds h where h.owner_id=actor and h.paused and ((h.resource_kind=p_kind and h.resource_id=target) or (p_kind='offering' and h.resource_kind='profile' and h.resource_id=actor)))
 from (select 1) seed left join public.marketplace_visibility_selections v on v.owner_id=actor and v.resource_kind=p_kind and v.resource_id=target;
end;
$$;
revoke all on function public.get_own_pilot_visibility_diagnostics(uuid,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_own_pilot_visibility_diagnostics(uuid,text,uuid) to authenticated;
commit;
