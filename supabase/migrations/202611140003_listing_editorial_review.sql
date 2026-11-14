-- Private listing inspection/editorial approval. No public listing policy.
begin;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback','marketplace_publication_approval','listing_publication_review'));
create table public.listing_editorial_approvals (
 submission_id uuid primary key references public.listing_publication_submissions(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 reviewer_id uuid not null,
 kind text not null check(kind in ('offering','looking')),
 recorded_fields jsonb not null check(jsonb_typeof(recorded_fields)='object'),
 approved_at timestamptz not null default clock_timestamp()
);
alter table public.listing_editorial_approvals enable row level security;
alter table public.listing_editorial_approvals force row level security;
revoke all on public.listing_editorial_approvals from public,anon,authenticated,service_role;
grant select(submission_id,owner_id,kind,recorded_fields,approved_at) on public.listing_editorial_approvals to authenticated;
grant select on public.listing_editorial_approvals to service_role;
create policy listing_editorial_owner_read on public.listing_editorial_approvals for select to authenticated using(owner_id=auth.uid());
create table public.listing_review_events (
 event_id bigint generated always as identity primary key,
 reviewer_id uuid not null,
 action text not null check(action in ('queue_list','copy_opened','editorial_approved')),
 submission_id uuid,
 occurred_at timestamptz not null default clock_timestamp()
);
alter table public.listing_review_events enable row level security;
alter table public.listing_review_events force row level security;
revoke all on public.listing_review_events from public,anon,authenticated,service_role;
grant select on public.listing_review_events to service_role;
create function public.can_review_listing_publications() returns boolean language sql stable security invoker set search_path='' as $$
 select (public.has_account_role('admin') or public.has_account_role('moderator')) and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='listing_publication_review');
$$;
create function public.list_listing_publications_for_review(p_expected_reviewer uuid,p_after_time timestamptz default null,p_after_id uuid default null)
returns table(id uuid,title text,kind text,submitted_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or p_expected_reviewer is distinct from auth.uid() then raise exception 'Reviewer changed'; end if;
 if not public.can_review_listing_publications() then raise exception 'Assigned listing review access required'; end if;
 if (p_after_time is null)<>(p_after_id is null) then raise exception 'Incomplete cursor'; end if;
 insert into public.listing_review_events(reviewer_id,action) values(auth.uid(),'queue_list');
 return query select s.id,s.recorded_fields->>'title',s.kind,s.submitted_at from public.listing_publication_submissions s
 where s.withdrawn_at is null and not exists(select 1 from public.listing_editorial_approvals a where a.submission_id=s.id)
 and (p_after_time is null or (s.submitted_at,s.id)>(p_after_time,p_after_id)) order by s.submitted_at,s.id limit 21;
end;
$$;
create function public.get_listing_publication_for_review(p_expected_reviewer uuid,p_submission uuid)
returns table(id uuid,owner_id uuid,kind text,recorded_fields jsonb,submitted_at timestamptz,approved_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare found_rows integer;
begin
 if auth.uid() is null or p_expected_reviewer is distinct from auth.uid() then raise exception 'Reviewer changed'; end if;
 if not public.can_review_listing_publications() then raise exception 'Assigned listing review access required'; end if;
 return query select s.id,s.owner_id,s.kind,s.recorded_fields,s.submitted_at,a.approved_at from public.listing_publication_submissions s
 left join public.listing_editorial_approvals a on a.submission_id=s.id where s.id=p_submission and s.withdrawn_at is null;
 get diagnostics found_rows=row_count;
 if found_rows>0 then insert into public.listing_review_events(reviewer_id,action,submission_id) values(auth.uid(),'copy_opened',p_submission); end if;
end;
$$;
create function public.approve_listing_editorial_copy(p_expected_reviewer uuid,p_submission uuid)
returns table(submission_id uuid,approved_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();copy public.listing_publication_submissions;
begin
 if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer changed'; end if;
 perform 1 from public.account_roles where user_id=reviewer and role in ('admin','moderator') order by role for share;
 perform 1 from public.staff_capabilities where user_id=reviewer and capability in ('listing_publication_review','marketplace_publication_approval') order by capability for share;
 if not public.can_review_listing_publications() or not public.can_approve_marketplace_publications() then raise exception 'Assigned Administrator and publishing approval access required'; end if;
 select * into copy from public.listing_publication_submissions where id=p_submission for update;
 if not found or copy.withdrawn_at is not null then raise exception 'Active listing copy unavailable'; end if;
 if copy.owner_id=reviewer then raise exception 'Self approval is not permitted'; end if;
 perform 1 from public.account_roles where user_id=copy.owner_id and role in ('user','provider') order by role for share;
 if not exists(select 1 from public.account_roles where user_id=copy.owner_id and role='user') then raise exception 'Current User membership required'; end if;
 if copy.kind='offering' and not exists(select 1 from public.account_roles where user_id=copy.owner_id and role='provider') then raise exception 'Current Provider membership required'; end if;
 return query insert into public.listing_editorial_approvals as a(submission_id,owner_id,reviewer_id,kind,recorded_fields)
 values(copy.id,copy.owner_id,reviewer,copy.kind,copy.recorded_fields) returning a.submission_id,a.approved_at;
 insert into public.listing_review_events(reviewer_id,action,submission_id) values(reviewer,'editorial_approved',copy.id);
end;
$$;
revoke all on function public.can_review_listing_publications(),public.list_listing_publications_for_review(uuid,timestamptz,uuid),public.get_listing_publication_for_review(uuid,uuid),public.approve_listing_editorial_copy(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_review_listing_publications(),public.list_listing_publications_for_review(uuid,timestamptz,uuid),public.get_listing_publication_for_review(uuid,uuid),public.approve_listing_editorial_copy(uuid,uuid) to authenticated;
commit;
