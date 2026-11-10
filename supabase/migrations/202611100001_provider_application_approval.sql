begin;
-- Confirmed pilot policy: Admin + explicit approval scope; Provider adds to User.
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check
  check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval'));
alter table public.provider_applications drop constraint provider_applications_state_check;
alter table public.provider_applications add constraint provider_applications_state_check
  check(state in ('draft','submitted','withdrawn','changes_requested','approved'));
alter table public.provider_application_events drop constraint provider_application_events_state_check;
alter table public.provider_application_events add constraint provider_application_events_state_check
  check(state in ('draft','submitted','withdrawn','changes_requested','approved'));
create table public.provider_application_approvals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null unique references public.provider_application_submissions(id) on delete cascade,
  reviewer_id uuid not null,
  approved_at timestamptz not null default now()
);
alter table public.provider_application_approvals enable row level security;
alter table public.provider_application_approvals force row level security;
revoke all on public.provider_application_approvals from public,anon,authenticated,service_role;
grant select on public.provider_application_approvals to service_role;
grant select(owner_id,submission_id,approved_at) on public.provider_application_approvals to authenticated;
create policy provider_approval_owner_read on public.provider_application_approvals for select to authenticated using((select auth.uid())=owner_id);
create function public.can_approve_provider_applications() returns boolean
language sql stable security invoker set search_path='' as $$
  select public.has_account_role('admin') and public.can_review_provider_applications()
    and exists(select 1 from public.staff_capabilities where user_id=(select auth.uid()) and capability='provider_application_approval');
$$;
revoke all on function public.can_approve_provider_applications() from public,anon,authenticated,service_role;
grant execute on function public.can_approve_provider_applications() to authenticated;
create function public.approve_provider_application(p_expected_reviewer uuid,p_owner uuid,p_submission uuid)
returns public.provider_applications language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid(); application public.provider_applications; locked_scopes integer;
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_approve_provider_applications() then raise exception 'Assigned administrator approval access required'; end if;
  if reviewer=p_owner then raise exception 'Independent administrator approval required'; end if;
  perform 1 from public.account_roles where user_id=reviewer and role='admin' for share;
  if not found then raise exception 'Assigned administrator approval access required'; end if;
  perform 1 from public.staff_capabilities where user_id=reviewer and capability in ('provider_application_review','provider_application_approval') order by capability for share;
  get diagnostics locked_scopes=row_count;
  if locked_scopes<>2 then raise exception 'Assigned administrator approval access required'; end if;
  select * into application from public.provider_applications where owner_id=p_owner for update;
  if application.owner_id is null or application.state<>'submitted' or p_submission is distinct from application.submission_id then raise exception 'Submission changed or no longer pending'; end if;
  if not exists(select 1 from public.provider_application_submissions where id=p_submission and owner_id=p_owner) then raise exception 'Submission unavailable'; end if;
  -- Do not restore a separately revoked basic membership during approval.
  perform 1 from public.account_roles where user_id=p_owner and role='user' for share;
  if not found then raise exception 'Applicant basic User membership required'; end if;
  insert into public.provider_application_approvals(owner_id,submission_id,reviewer_id) values(p_owner,p_submission,reviewer);
  insert into public.account_roles(user_id,role) values(p_owner,'provider') on conflict(user_id,role) do nothing;
  update public.provider_applications set state='approved' where owner_id=p_owner returning * into application;
  return application;
end;
$$;
revoke all on function public.approve_provider_application(uuid,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.approve_provider_application(uuid,uuid,uuid) to authenticated;
create or replace function public.save_provider_application(p_expected_owner uuid,p_display_name text,p_city text,p_introduction text)
returns public.provider_applications language plpgsql security definer set search_path='' as $$
declare requester uuid:=auth.uid(); result public.provider_applications;
begin
  if requester is null or p_expected_owner is distinct from requester then raise exception 'Account changed or not authenticated'; end if;
  insert into public.provider_applications(owner_id,display_name,city,introduction) values(requester,btrim(p_display_name),btrim(p_city),btrim(p_introduction))
  on conflict(owner_id) do update set display_name=excluded.display_name,city=excluded.city,introduction=excluded.introduction,
    state='draft',submitted_at=null,withdrawn_at=null,submission_id=null where public.provider_applications.state in ('draft','withdrawn','changes_requested') returning * into result;
  if result.owner_id is null then raise exception 'Application is locked in its current state'; end if;
  return result;
end;
$$;
commit;
