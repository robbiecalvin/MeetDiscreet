begin;
create index provider_approvals_reviewer_history on public.provider_application_approvals(reviewer_id,approved_at desc,id desc);
alter table public.provider_review_access_events drop constraint provider_review_access_events_action_check;
alter table public.provider_review_access_events add constraint provider_review_access_events_action_check
  check(action in ('queue_list','application_opened','approval_history_list'));
create function public.list_my_provider_approvals(
  p_expected_reviewer uuid,p_limit integer default 21,
  p_before_approved_at timestamptz default null,p_before_id uuid default null
) returns table(approval_id uuid,owner_id uuid,submission_id uuid,approved_at timestamptz,display_name text,city text,submitted_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_approve_provider_applications() then raise exception 'Assigned administrator approval access required'; end if;
  if p_limit is null or p_limit<1 or p_limit>50 then raise exception 'Invalid page size'; end if;
  if (p_before_approved_at is null)<>(p_before_id is null) then raise exception 'Invalid page cursor'; end if;
  insert into public.provider_review_access_events(reviewer_id,action) values(reviewer,'approval_history_list');
  return query select a.id,a.owner_id,a.submission_id,a.approved_at,s.display_name,s.city,s.submitted_at
    from public.provider_application_approvals a join public.provider_application_submissions s on s.id=a.submission_id and s.owner_id=a.owner_id
    where a.reviewer_id=reviewer and (p_before_approved_at is null or (a.approved_at,a.id)<(p_before_approved_at,p_before_id))
    order by a.approved_at desc,a.id desc limit p_limit;
end;
$$;
revoke all on function public.list_my_provider_approvals(uuid,integer,timestamptz,uuid) from public,anon,authenticated,service_role;
grant execute on function public.list_my_provider_approvals(uuid,integer,timestamptz,uuid) to authenticated;
commit;
