-- Editorial approval only. No public SELECT policy, plan entitlement or photo upload.
begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check
 check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback','marketplace_publication_approval'));
alter table public.profile_publication_review_access_events drop constraint profile_publication_review_access_events_action_check;
alter table public.profile_publication_review_access_events add constraint profile_publication_review_access_events_action_check
 check(action in ('queue_list','copy_opened','queue_search','feedback_opened','feedback_recorded','approval_opened','editorial_approved'));
create table public.profile_editorial_approvals (
 submission_id uuid primary key references public.profile_publication_submissions(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 reviewer_id uuid not null,
 public_fields jsonb not null check(jsonb_typeof(public_fields)='object'),
 approved_at timestamptz not null default clock_timestamp()
);
alter table public.profile_editorial_approvals enable row level security;
alter table public.profile_editorial_approvals force row level security;
revoke all on public.profile_editorial_approvals from public,anon,authenticated,service_role;
grant select(submission_id,owner_id,public_fields,approved_at) on public.profile_editorial_approvals to authenticated;
grant select on public.profile_editorial_approvals to service_role;
create policy profile_editorial_owner_read on public.profile_editorial_approvals for select to authenticated using(owner_id=auth.uid());
create function public.can_approve_marketplace_publications() returns boolean
language sql stable security invoker set search_path='' as $$
 select public.has_account_role('admin') and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='marketplace_publication_approval');
$$;
create function public.get_profile_editorial_approval(p_expected_reviewer uuid,p_submission uuid)
returns table(submission_id uuid,approved_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_expected_reviewer is distinct from auth.uid() then raise exception 'Reviewer changed'; end if;
 if not public.can_review_profile_publications() then raise exception 'Assigned profile review access required'; end if;
 return query select a.submission_id,a.approved_at from public.profile_editorial_approvals a where a.submission_id=p_submission;
 insert into public.profile_publication_review_access_events(reviewer_id,action,submission_id) values(auth.uid(),'approval_opened',p_submission);
end;
$$;
create function public.approve_profile_editorial_copy(p_expected_reviewer uuid,p_submission uuid)
returns table(submission_id uuid,approved_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();copy public.profile_publication_submissions;
begin
 if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer changed'; end if;
 perform 1 from public.account_roles where user_id=reviewer and role in ('admin','moderator') order by role for share;
 perform 1 from public.staff_capabilities where user_id=reviewer and capability in ('profile_publication_review','marketplace_publication_approval') order by capability for share;
 if not public.can_review_profile_publications() or not public.can_approve_marketplace_publications() then raise exception 'Assigned Administrator and publishing approval access required'; end if;
 select * into copy from public.profile_publication_submissions where id=p_submission for update;
 if not found or copy.withdrawn_at is not null then raise exception 'Pending profile copy unavailable'; end if;
 if copy.owner_id=reviewer then raise exception 'Self approval is not permitted'; end if;
 if exists(select 1 from public.profile_publication_feedback f where f.submission_id=copy.id) then raise exception 'A revised copy is required after feedback'; end if;
 perform 1 from public.account_roles where user_id=copy.owner_id and role in ('user','provider') order by role for share;
 if not exists(select 1 from public.account_roles where user_id=copy.owner_id and role='user') or not exists(select 1 from public.account_roles where user_id=copy.owner_id and role='provider') then raise exception 'Current User and Provider membership required'; end if;
 return query insert into public.profile_editorial_approvals as a(submission_id,owner_id,reviewer_id,public_fields)
 values(copy.id,copy.owner_id,reviewer,jsonb_build_object(
 'display_name',copy.public_fields->'display_name','username',copy.public_fields->'username','adult_age',copy.public_fields->'adult_age',
 'tagline',copy.public_fields->'tagline','city',copy.public_fields->'city','area',copy.public_fields->'area','photo_index',copy.public_fields->'photo_index'))
 returning a.submission_id,a.approved_at;
 insert into public.profile_publication_review_access_events(reviewer_id,action,submission_id) values(reviewer,'editorial_approved',copy.id);
end;
$$;
create or replace function public.record_profile_revision_feedback(p_expected_reviewer uuid,p_submission uuid,p_note text)
returns table(submission_id uuid,note text,created_at timestamptz) language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();copy public.profile_publication_submissions;clean_note text;
begin
 if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
 perform 1 from public.account_roles where user_id=reviewer and role in ('moderator','admin') order by role for share;
 perform 1 from public.staff_capabilities where user_id=reviewer and capability in ('profile_publication_review','profile_publication_feedback') order by capability for share;
 if not public.can_give_profile_publication_feedback() then raise exception 'Assigned profile feedback access required'; end if;
 clean_note:=regexp_replace(p_note,'^[[:space:]]+|[[:space:]]+$','','g');
 if clean_note is null or char_length(clean_note)<1 or char_length(clean_note)>1000 then raise exception 'Feedback must contain 1 to 1000 characters'; end if;
 select * into copy from public.profile_publication_submissions where id=p_submission for update;
 if not found or copy.withdrawn_at is not null then raise exception 'Pending profile copy unavailable'; end if;
 if exists(select 1 from public.profile_editorial_approvals a where a.submission_id=copy.id) then raise exception 'Approved copy cannot receive revision feedback; use a replacement copy'; end if;
 if copy.owner_id=reviewer then raise exception 'Self feedback is not permitted'; end if;
 return query insert into public.profile_publication_feedback as f(submission_id,reviewer_id,note) values(copy.id,reviewer,clean_note) returning f.submission_id,f.note,f.created_at;
 insert into public.profile_publication_review_access_events(reviewer_id,action,submission_id) values(reviewer,'feedback_recorded',copy.id);
end;
$$;
revoke all on function public.can_approve_marketplace_publications(),public.get_profile_editorial_approval(uuid,uuid),public.approve_profile_editorial_copy(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_approve_marketplace_publications(),public.get_profile_editorial_approval(uuid,uuid),public.approve_profile_editorial_copy(uuid,uuid) to authenticated;
commit;
