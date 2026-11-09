begin;
create index provider_applications_submitted_queue on public.provider_applications(submitted_at,owner_id) where state='submitted' and submitted_at is not null;
create table public.staff_capabilities (
  user_id uuid not null references auth.users(id) on delete cascade,
  capability text not null check (capability in ('provider_application_review')),
  assigned_at timestamptz not null default now(),
  primary key (user_id,capability)
);
create table public.staff_capability_events (
  event_id bigint generated always as identity primary key,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_user_id uuid, new_user_id uuid,
  old_capability text, new_capability text,
  actor_user_id uuid,
  actor_database_role text not null,
  occurred_at timestamptz not null default now()
);
create table public.provider_review_access_events (
  event_id bigint generated always as identity primary key,
  reviewer_id uuid not null,
  action text not null check (action in ('queue_list','application_opened')),
  subject_owner_id uuid,
  occurred_at timestamptz not null default now()
);
alter table public.staff_capabilities enable row level security;
alter table public.staff_capabilities force row level security;
alter table public.staff_capability_events enable row level security;
alter table public.staff_capability_events force row level security;
alter table public.provider_review_access_events enable row level security;
alter table public.provider_review_access_events force row level security;
revoke all on public.staff_capabilities, public.staff_capability_events, public.provider_review_access_events from public, anon, authenticated, service_role;
grant select on public.staff_capabilities to authenticated;
grant select,insert,update,delete on public.staff_capabilities to service_role;
grant select on public.staff_capability_events, public.provider_review_access_events to service_role;
create policy staff_capability_owner_read on public.staff_capabilities for select to authenticated using ((select auth.uid())=user_id);
create function public.audit_staff_capability_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.staff_capability_events(action,old_user_id,new_user_id,old_capability,new_capability,actor_user_id,actor_database_role)
  values (tg_op,
    case when tg_op<>'INSERT' then old.user_id else null end,
    case when tg_op<>'DELETE' then new.user_id else null end,
    case when tg_op<>'INSERT' then old.capability else null end,
    case when tg_op<>'DELETE' then new.capability else null end,
    auth.uid(),coalesce(nullif(current_setting('role',true),'none'),session_user));
  return null;
end;
$$;
revoke all on function public.audit_staff_capability_change() from public,anon,authenticated,service_role;
create trigger staff_capability_changed after insert or update or delete on public.staff_capabilities
  for each row execute function public.audit_staff_capability_change();

create function public.can_review_provider_applications() returns boolean
language sql stable security invoker set search_path = '' as $$
  select (public.has_account_role('moderator'::text) or public.has_account_role('admin'::text))
    and exists (select 1 from public.staff_capabilities where user_id=(select auth.uid()) and capability='provider_application_review');
$$;
revoke all on function public.can_review_provider_applications() from public,anon,authenticated,service_role;
grant execute on function public.can_review_provider_applications() to authenticated;

create function public.list_provider_applications_for_review(
  p_expected_reviewer uuid, p_limit integer default 21,
  p_after_submitted_at timestamptz default null, p_after_owner uuid default null
) returns table(owner_id uuid,display_name text,city text,submitted_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare reviewer uuid := auth.uid();
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_provider_applications() then raise exception 'Assigned provider review access required'; end if;
  if p_limit is null or p_limit<1 or p_limit>50 then raise exception 'Invalid page size'; end if;
  if (p_after_submitted_at is null) <> (p_after_owner is null) then raise exception 'Invalid page cursor'; end if;
  insert into public.provider_review_access_events(reviewer_id,action) values (reviewer,'queue_list');
  return query select a.owner_id,a.display_name,a.city,a.submitted_at,a.updated_at
    from public.provider_applications a
    where a.state='submitted' and a.submitted_at is not null
      and (p_after_submitted_at is null or (a.submitted_at,a.owner_id)>(p_after_submitted_at,p_after_owner))
    order by a.submitted_at,a.owner_id limit p_limit;
end;
$$;
create function public.get_provider_application_for_review(p_expected_reviewer uuid,p_owner uuid)
returns table(owner_id uuid,display_name text,city text,introduction text,state text,submitted_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare reviewer uuid := auth.uid(); found_rows integer;
begin
  if reviewer is null or p_expected_reviewer is distinct from reviewer then raise exception 'Reviewer account changed or not authenticated'; end if;
  if not public.can_review_provider_applications() then raise exception 'Assigned provider review access required'; end if;
  return query select a.owner_id,a.display_name,a.city,a.introduction,a.state,a.submitted_at,a.updated_at
    from public.provider_applications a where a.owner_id=p_owner and a.state='submitted' and a.submitted_at is not null;
  get diagnostics found_rows=row_count;
  if found_rows>0 then insert into public.provider_review_access_events(reviewer_id,action,subject_owner_id) values (reviewer,'application_opened',p_owner); end if;
end;
$$;
revoke all on function public.list_provider_applications_for_review(uuid,integer,timestamptz,uuid), public.get_provider_application_for_review(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.list_provider_applications_for_review(uuid,integer,timestamptz,uuid), public.get_provider_application_for_review(uuid,uuid) to authenticated;
commit;
