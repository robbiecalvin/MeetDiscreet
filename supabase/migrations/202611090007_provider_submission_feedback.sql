begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check
  check (capability in ('provider_application_review','provider_application_feedback'));
alter table public.provider_applications drop constraint provider_applications_state_check;
alter table public.provider_applications add constraint provider_applications_state_check check (state in ('draft','submitted','withdrawn','changes_requested'));
alter table public.provider_application_events drop constraint provider_application_events_state_check;
alter table public.provider_application_events add constraint provider_application_events_state_check check (state in ('draft','submitted','withdrawn','changes_requested'));
create table public.provider_application_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null, city text not null, introduction text not null,
  submitted_at timestamptz not null
);
alter table public.provider_applications add column submission_id uuid references public.provider_application_submissions(id) deferrable initially deferred;
create table public.provider_application_feedback (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null unique references public.provider_application_submissions(id) on delete cascade,
  reviewer_id uuid not null,
  note text not null check (char_length(note)<=1000 and note ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
alter table public.provider_application_submissions enable row level security;
alter table public.provider_application_submissions force row level security;
alter table public.provider_application_feedback enable row level security;
alter table public.provider_application_feedback force row level security;
revoke all on public.provider_application_submissions,public.provider_application_feedback from public,anon,authenticated,service_role;
grant select on public.provider_application_submissions to authenticated,service_role;
grant select on public.provider_application_feedback to service_role;
grant select(owner_id,submission_id,note,created_at) on public.provider_application_feedback to authenticated;
create policy provider_submission_owner_read on public.provider_application_submissions for select to authenticated using ((select auth.uid())=owner_id);
create policy provider_feedback_owner_read on public.provider_application_feedback for select to authenticated using ((select auth.uid())=owner_id);

create function public.capture_provider_submission() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.state='submitted' and (tg_op='INSERT' or old.state<>'submitted') then
    insert into public.provider_application_submissions(owner_id,display_name,city,introduction,submitted_at)
      values(new.owner_id,new.display_name,new.city,new.introduction,new.submitted_at) returning id into new.submission_id;
  end if;
  return new;
end;
$$;
revoke all on function public.capture_provider_submission() from public,anon,authenticated,service_role;
create trigger provider_submission_captured before insert or update on public.provider_applications
  for each row execute function public.capture_provider_submission();
-- Preserve already-submitted intake when upgrading the development project.
do $$
declare application record; snapshot_id uuid;
begin
  for application in select * from public.provider_applications where state='submitted' loop
    insert into public.provider_application_submissions(owner_id,display_name,city,introduction,submitted_at)
      values(application.owner_id,application.display_name,application.city,application.introduction,coalesce(application.submitted_at,application.updated_at)) returning id into snapshot_id;
    update public.provider_applications set submission_id=snapshot_id where owner_id=application.owner_id;
  end loop;
end;
$$;
create or replace function public.save_provider_application(p_expected_owner uuid,p_display_name text,p_city text,p_introduction text)
returns public.provider_applications language plpgsql security definer set search_path='' as $$
declare requester uuid:=auth.uid(); result public.provider_applications;
begin
  if requester is null or p_expected_owner is distinct from requester then raise exception 'Account changed or not authenticated'; end if;
  insert into public.provider_applications(owner_id,display_name,city,introduction) values(requester,btrim(p_display_name),btrim(p_city),btrim(p_introduction))
  on conflict(owner_id) do update set display_name=excluded.display_name,city=excluded.city,introduction=excluded.introduction,
    state='draft',submitted_at=null,withdrawn_at=null,submission_id=null where public.provider_applications.state in ('draft','withdrawn','changes_requested') returning * into result;
  if result.owner_id is null then raise exception 'Withdraw the submitted application before editing'; end if;
  return result;
end;
$$;
create function public.can_request_provider_application_changes() returns boolean language sql stable security invoker set search_path='' as $$
  select public.can_review_provider_applications() and exists(select 1 from public.staff_capabilities where user_id=(select auth.uid()) and capability='provider_application_feedback');
$$;
revoke all on function public.can_request_provider_application_changes() from public,anon,authenticated,service_role;
grant execute on function public.can_request_provider_application_changes() to authenticated;
create function public.request_provider_application_changes(p_expected_reviewer uuid,p_owner uuid,p_submission uuid,p_note text)
returns public.provider_applications language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid(); application public.provider_applications;
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_request_provider_application_changes() then raise exception 'Assigned feedback access required'; end if;
  if reviewer=p_owner then raise exception 'Independent staff feedback required'; end if;
  if p_note is null or char_length(p_note)>1000 or not(p_note ~ '[^[:space:]]') then raise exception 'Enter a feedback note of at most 1000 characters'; end if;
  select * into application from public.provider_applications where owner_id=p_owner for update;
  if application.owner_id is null or application.state<>'submitted' or p_submission is distinct from application.submission_id then raise exception 'Submission changed or no longer pending'; end if;
  if not exists(select 1 from public.provider_application_submissions where id=p_submission and owner_id=p_owner) then raise exception 'Submission unavailable'; end if;
  insert into public.provider_application_feedback(owner_id,submission_id,reviewer_id,note) values(p_owner,p_submission,reviewer,btrim(p_note));
  update public.provider_applications set state='changes_requested' where owner_id=p_owner returning * into application;
  return application;
end;
$$;
revoke all on function public.request_provider_application_changes(uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.request_provider_application_changes(uuid,uuid,uuid,text) to authenticated;

drop function public.get_provider_application_for_review(uuid,uuid);
create function public.get_provider_application_for_review(p_expected_reviewer uuid,p_owner uuid)
returns table(owner_id uuid,display_name text,city text,introduction text,state text,submitted_at timestamptz,updated_at timestamptz,submission_id uuid)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid(); found_rows integer;
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_provider_applications() then raise exception 'Assigned provider review access required'; end if;
  return query select a.owner_id,s.display_name,s.city,s.introduction,a.state,s.submitted_at,a.updated_at,s.id from public.provider_applications a
    join public.provider_application_submissions s on s.id=a.submission_id and s.owner_id=a.owner_id where a.owner_id=p_owner and a.state='submitted';
  get diagnostics found_rows=row_count;
  if found_rows>0 then insert into public.provider_review_access_events(reviewer_id,action,subject_owner_id) values(reviewer,'application_opened',p_owner); end if;
end;
$$;
revoke all on function public.get_provider_application_for_review(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_provider_application_for_review(uuid,uuid) to authenticated;
commit;
