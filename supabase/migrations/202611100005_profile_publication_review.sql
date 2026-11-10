-- Inspection only: no public profile, publishing decision, or real scope assignment.
begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check
  check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review'));
create index profile_publication_pending_queue on public.profile_publication_submissions(submitted_at,id) where withdrawn_at is null;
create index profile_publication_owner_history on public.profile_publication_submissions(owner_id,submitted_at desc,id desc);
create table public.profile_publication_review_access_events (
  event_id bigint generated always as identity primary key,
  reviewer_id uuid not null,
  action text not null check(action in ('queue_list','copy_opened')),
  submission_id uuid,
  occurred_at timestamptz not null default now()
);
alter table public.profile_publication_review_access_events enable row level security;
alter table public.profile_publication_review_access_events force row level security;
revoke all on public.profile_publication_review_access_events from public,anon,authenticated,service_role;
grant select on public.profile_publication_review_access_events to service_role;
create function public.can_review_profile_publications() returns boolean
language sql stable security invoker set search_path='' as $$
  select (public.has_account_role('moderator') or public.has_account_role('admin'))
    and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='profile_publication_review');
$$;
create function public.list_profile_publications_for_review(
  p_expected_reviewer uuid,p_limit integer default 21,
  p_after_submitted_at timestamptz default null,p_after_id uuid default null
) returns table(id uuid,owner_id uuid,display_name text,city text,submitted_at timestamptz,source_updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_profile_publications() then raise exception 'Assigned profile review access required'; end if;
  if p_limit is null or p_limit<1 or p_limit>50 then raise exception 'Invalid page size'; end if;
  if (p_after_submitted_at is null)<>(p_after_id is null) then raise exception 'Invalid page cursor'; end if;
  insert into public.profile_publication_review_access_events(reviewer_id,action) values(reviewer,'queue_list');
  return query select s.id,s.owner_id,s.public_fields->>'display_name',s.public_fields->>'city',s.submitted_at,s.source_updated_at
    from public.profile_publication_submissions s where s.withdrawn_at is null
      and (p_after_submitted_at is null or (s.submitted_at,s.id)>(p_after_submitted_at,p_after_id))
    order by s.submitted_at,s.id limit p_limit;
end;
$$;
create function public.get_profile_publication_for_review(p_expected_reviewer uuid,p_submission uuid)
returns table(id uuid,owner_id uuid,public_fields jsonb,submitted_at timestamptz,source_updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();found_rows integer;
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_profile_publications() then raise exception 'Assigned profile review access required'; end if;
  return query select s.id,s.owner_id,jsonb_build_object(
    'display_name',s.public_fields->'display_name','username',s.public_fields->'username','adult_age',s.public_fields->'adult_age',
    'tagline',s.public_fields->'tagline','city',s.public_fields->'city','area',s.public_fields->'area','photo_index',s.public_fields->'photo_index'),s.submitted_at,s.source_updated_at
    from public.profile_publication_submissions s where s.id=p_submission and s.withdrawn_at is null;
  get diagnostics found_rows=row_count;
  if found_rows>0 then insert into public.profile_publication_review_access_events(reviewer_id,action,submission_id) values(reviewer,'copy_opened',p_submission); end if;
end;
$$;
revoke all on function public.can_review_profile_publications(),public.list_profile_publications_for_review(uuid,integer,timestamptz,uuid),public.get_profile_publication_for_review(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_review_profile_publications(),public.list_profile_publications_for_review(uuid,integer,timestamptz,uuid),public.get_profile_publication_for_review(uuid,uuid) to authenticated;
commit;
