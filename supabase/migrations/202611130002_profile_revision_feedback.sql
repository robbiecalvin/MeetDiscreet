begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check
 check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback'));
alter table public.profile_publication_review_access_events drop constraint profile_publication_review_access_events_action_check;
alter table public.profile_publication_review_access_events add constraint profile_publication_review_access_events_action_check
 check(action in ('queue_list','copy_opened','queue_search','feedback_opened','feedback_recorded'));
create table public.profile_publication_feedback (
 submission_id uuid primary key references public.profile_publication_submissions(id) on delete cascade,
 reviewer_id uuid not null,
 note text not null check(char_length(btrim(note)) between 1 and 1000),
 created_at timestamptz not null default now()
);
alter table public.profile_publication_feedback enable row level security;
alter table public.profile_publication_feedback force row level security;
revoke all on public.profile_publication_feedback from public,anon,authenticated,service_role;
grant select(submission_id,note,created_at) on public.profile_publication_feedback to authenticated;
grant select on public.profile_publication_feedback to service_role;
create policy profile_feedback_owner_read on public.profile_publication_feedback for select to authenticated
 using(exists(select 1 from public.profile_publication_submissions s where s.id=profile_publication_feedback.submission_id and s.owner_id=auth.uid()));
create function public.can_give_profile_publication_feedback() returns boolean language sql stable security invoker set search_path='' as $$
 select public.can_review_profile_publications() and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='profile_publication_feedback');
$$;
create function public.get_profile_revision_feedback(p_expected_reviewer uuid,p_submission uuid)
returns table(submission_id uuid,note text,created_at timestamptz) language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();
begin
 if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
 if not public.can_give_profile_publication_feedback() then raise exception 'Assigned profile feedback access required'; end if;
 return query select f.submission_id,f.note,f.created_at from public.profile_publication_feedback f
 join public.profile_publication_submissions s on s.id=f.submission_id where s.id=p_submission and s.withdrawn_at is null;
 insert into public.profile_publication_review_access_events(reviewer_id,action,submission_id) values(reviewer,'feedback_opened',p_submission);
end;
$$;
create function public.record_profile_revision_feedback(p_expected_reviewer uuid,p_submission uuid,p_note text)
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
 if copy.owner_id=reviewer then raise exception 'Self feedback is not permitted'; end if;
 return query insert into public.profile_publication_feedback as f(submission_id,reviewer_id,note) values(copy.id,reviewer,clean_note) returning f.submission_id,f.note,f.created_at;
 insert into public.profile_publication_review_access_events(reviewer_id,action,submission_id) values(reviewer,'feedback_recorded',copy.id);
end;
$$;
revoke all on function public.can_give_profile_publication_feedback(),public.get_profile_revision_feedback(uuid,uuid),public.record_profile_revision_feedback(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.can_give_profile_publication_feedback(),public.get_profile_revision_feedback(uuid,uuid),public.record_profile_revision_feedback(uuid,uuid,text) to authenticated;
commit;
