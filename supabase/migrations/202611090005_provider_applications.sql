begin;
-- Private intake only. Submission never approves a provider or grants a role.
create table public.provider_applications (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  city text not null default '' check (char_length(city) <= 100),
  introduction text not null default '' check (char_length(introduction) <= 1000),
  state text not null default 'draft' check (state in ('draft','submitted','withdrawn')),
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.provider_application_events (
  event_id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  state text not null check (state in ('draft','submitted','withdrawn')),
  occurred_at timestamptz not null default now()
);
alter table public.provider_applications enable row level security;
alter table public.provider_applications force row level security;
alter table public.provider_application_events enable row level security;
alter table public.provider_application_events force row level security;
revoke all on public.provider_applications, public.provider_application_events from public, anon, authenticated, service_role;
grant select on public.provider_applications, public.provider_application_events to authenticated, service_role;
create policy provider_application_owner_read on public.provider_applications for select to authenticated using ((select auth.uid()) = owner_id);
create policy provider_application_event_owner_read on public.provider_application_events for select to authenticated using ((select auth.uid()) = owner_id);
create trigger provider_application_updated before update on public.provider_applications
  for each row execute function public.touch_private_draft_updated_at();

create function public.record_provider_application_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.provider_application_events(owner_id,state) values (new.owner_id,new.state);
  return null;
end;
$$;
revoke all on function public.record_provider_application_event() from public, anon, authenticated, service_role;
create trigger provider_application_changed after insert or update on public.provider_applications
  for each row execute function public.record_provider_application_event();

create function public.save_provider_application(p_expected_owner uuid, p_display_name text, p_city text, p_introduction text)
returns public.provider_applications language plpgsql security definer set search_path = '' as $$
declare requester uuid := auth.uid(); result public.provider_applications;
begin
  if requester is null or p_expected_owner is distinct from requester then raise exception 'Account changed or not authenticated'; end if;
  insert into public.provider_applications(owner_id,display_name,city,introduction)
    values (requester,btrim(p_display_name),btrim(p_city),btrim(p_introduction))
  on conflict (owner_id) do update set display_name=excluded.display_name, city=excluded.city,
    introduction=excluded.introduction, state='draft',submitted_at=null,withdrawn_at=null
    where public.provider_applications.state in ('draft','withdrawn')
  returning * into result;
  if result.owner_id is null then raise exception 'Withdraw the submitted application before editing'; end if;
  return result;
end;
$$;

create function public.submit_provider_application(p_expected_owner uuid)
returns public.provider_applications language plpgsql security definer set search_path = '' as $$
declare requester uuid := auth.uid(); result public.provider_applications;
begin
  if requester is null or p_expected_owner is distinct from requester then raise exception 'Account changed or not authenticated'; end if;
  if not public.has_account_role('user'::text) then raise exception 'Basic User membership required'; end if;
  update public.provider_applications set state='submitted', submitted_at=now(), withdrawn_at=null
    where owner_id=requester and state='draft'
      and display_name ~ '[^[:space:]]' and city ~ '[^[:space:]]' and introduction ~ '[^[:space:]]'
    returning * into result;
  if result.owner_id is null then raise exception 'Save a complete application draft before submitting'; end if;
  return result;
end;
$$;

create function public.withdraw_provider_application(p_expected_owner uuid)
returns public.provider_applications language plpgsql security definer set search_path = '' as $$
declare requester uuid := auth.uid(); result public.provider_applications;
begin
  if requester is null or p_expected_owner is distinct from requester then raise exception 'Account changed or not authenticated'; end if;
  update public.provider_applications set state='withdrawn',withdrawn_at=now()
    where owner_id=requester and state='submitted' returning * into result;
  if result.owner_id is null then raise exception 'No submitted application to withdraw'; end if;
  return result;
end;
$$;
revoke all on function public.save_provider_application(uuid,text,text,text), public.submit_provider_application(uuid), public.withdraw_provider_application(uuid) from public, anon, authenticated, service_role;
grant execute on function public.save_provider_application(uuid,text,text,text), public.submit_provider_application(uuid), public.withdraw_provider_application(uuid) to authenticated;
commit;
