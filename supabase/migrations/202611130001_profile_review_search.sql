begin;
alter table public.profile_publication_review_access_events drop constraint profile_publication_review_access_events_action_check;
alter table public.profile_publication_review_access_events add constraint profile_publication_review_access_events_action_check
  check(action in ('queue_list','copy_opened','queue_search'));
create function public.search_profile_publications_for_review(
  p_expected_reviewer uuid,p_query text,p_limit integer default 21,
  p_after_submitted_at timestamptz default null,p_after_id uuid default null
) returns table(id uuid,owner_id uuid,display_name text,city text,submitted_at timestamptz,source_updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare reviewer uuid:=auth.uid();needle text:=btrim(p_query);
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_profile_publications() then raise exception 'Assigned profile review access required'; end if;
  if needle is null or char_length(needle)<1 or char_length(needle)>100 then raise exception 'Invalid search text'; end if;
  if p_limit is null or p_limit<1 or p_limit>50 then raise exception 'Invalid page size'; end if;
  if (p_after_submitted_at is null)<>(p_after_id is null) then raise exception 'Invalid page cursor'; end if;
  -- Do not record search text or candidate content in access metadata.
  insert into public.profile_publication_review_access_events(reviewer_id,action) values(reviewer,'queue_search');
  return query select s.id,s.owner_id,s.public_fields->>'display_name',s.public_fields->>'city',s.submitted_at,s.source_updated_at
    from public.profile_publication_submissions s where s.withdrawn_at is null
      and strpos(lower(coalesce(s.public_fields->>'display_name','')||' '||coalesce(s.public_fields->>'city','')),lower(needle))>0
      and (p_after_submitted_at is null or (s.submitted_at,s.id)>(p_after_submitted_at,p_after_id))
    order by s.submitted_at,s.id limit p_limit;
end;
$$;
revoke all on function public.search_profile_publications_for_review(uuid,text,integer,timestamptz,uuid) from public,anon,authenticated,service_role;
grant execute on function public.search_profile_publications_for_review(uuid,text,integer,timestamptz,uuid) to authenticated;
commit;
