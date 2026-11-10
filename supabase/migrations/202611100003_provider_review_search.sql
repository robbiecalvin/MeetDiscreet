begin;
alter table public.provider_review_access_events drop constraint provider_review_access_events_action_check;
alter table public.provider_review_access_events add constraint provider_review_access_events_action_check
  check(action in ('queue_list','application_opened','approval_history_list','queue_search'));
create function public.search_provider_applications_for_review(
  p_expected_reviewer uuid,p_query text,p_limit integer default 21,
  p_after_submitted_at timestamptz default null,p_after_owner uuid default null
) returns table(owner_id uuid,display_name text,city text,submitted_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid(); needle text:=btrim(p_query);
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_provider_applications() then raise exception 'Assigned provider review access required'; end if;
  if needle is null or char_length(needle)<1 or char_length(needle)>100 then raise exception 'Invalid search text'; end if;
  if p_limit is null or p_limit<1 or p_limit>50 then raise exception 'Invalid page size'; end if;
  if (p_after_submitted_at is null)<>(p_after_owner is null) then raise exception 'Invalid page cursor'; end if;
  -- Do not copy search text or applicant content into read-access metadata.
  insert into public.provider_review_access_events(reviewer_id,action) values(reviewer,'queue_search');
  return query select a.owner_id,a.display_name,a.city,a.submitted_at,a.updated_at
    from public.provider_applications a where a.state='submitted' and a.submitted_at is not null
      and strpos(lower(a.display_name||' '||a.city),lower(needle))>0
      and (p_after_submitted_at is null or (a.submitted_at,a.owner_id)>(p_after_submitted_at,p_after_owner))
    order by a.submitted_at,a.owner_id limit p_limit;
end;
$$;
revoke all on function public.search_provider_applications_for_review(uuid,text,integer,timestamptz,uuid) from public,anon,authenticated,service_role;
grant execute on function public.search_provider_applications_for_review(uuid,text,integer,timestamptz,uuid) to authenticated;
commit;
