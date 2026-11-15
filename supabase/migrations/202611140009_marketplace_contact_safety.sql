-- Free account safety controls. Blocking affects new contact, never deletes records.
begin;
create function public.lock_marketplace_contact_pair(p_first uuid,p_second uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_first is null or p_second is null or p_first=p_second then raise exception 'Two distinct accounts required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-contact:'||least(p_first,p_second)::text||':'||greatest(p_first,p_second)::text,0));
end;
$$;
create table public.marketplace_blocks (
 owner_id uuid not null references auth.users(id) on delete cascade,
 target_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp(),
 primary key(owner_id,target_id),check(owner_id<>target_id)
);
alter table public.marketplace_blocks enable row level security;
alter table public.marketplace_blocks force row level security;
revoke all on public.marketplace_blocks from public,anon,authenticated,service_role;
create function public.marketplace_contact_blocked(p_first uuid,p_second uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.marketplace_blocks b where (b.owner_id=p_first and b.target_id=p_second) or (b.owner_id=p_second and b.target_id=p_first));
$$;
-- Public-copy reporting captures only the text already readable by the reporter.
create table public.marketplace_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 target_owner_id uuid not null references auth.users(id) on delete cascade,
 target_kind text not null check(target_kind in ('profile','offering')),
 target_submission_id uuid not null,
 target_resource_id uuid not null,
 public_snapshot jsonb not null,
 category text not null check(category in ('safety','harassment','impersonation','content','other')),
 details text not null check(char_length(btrim(details)) between 1 and 2000),
 state text not null default 'open' check(state in ('open','reviewing','closed')),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 revision uuid not null default gen_random_uuid()
);
create unique index marketplace_report_one_active on public.marketplace_reports(reporter_id,target_kind,target_submission_id) where state<>'closed';
create index marketplace_report_queue on public.marketplace_reports(created_at,id);
alter table public.marketplace_reports enable row level security;
alter table public.marketplace_reports force row level security;
revoke all on public.marketplace_reports from public,anon,authenticated,service_role;
grant select(id,target_kind,target_submission_id,category,state,created_at,updated_at) on public.marketplace_reports to authenticated;
create policy marketplace_report_own_status on public.marketplace_reports for select to authenticated using(reporter_id=auth.uid());
create function public.submit_marketplace_report(p_expected_actor uuid,p_kind text,p_submission uuid,p_category text,p_details text)
returns table(id uuid,state text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();target uuid;resource uuid;snapshot jsonb;existing public.marketplace_reports;clean text;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed'; end if;
 if p_category is null or p_category not in ('safety','harassment','impersonation','content','other') then raise exception 'Invalid report category'; end if;
 clean:=btrim(p_details);if clean is null or char_length(clean)<1 or char_length(clean)>2000 then raise exception 'Report details must contain 1 to 2000 characters'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-report:'||actor::text,0));
 select * into existing from public.marketplace_reports r where r.reporter_id=actor and r.target_kind=p_kind and r.target_submission_id=p_submission and r.state<>'closed';
 if found then return query select existing.id,existing.state,existing.created_at;return;end if;
 if (select count(*) from public.marketplace_reports r where r.reporter_id=actor and r.created_at>statement_timestamp()-interval '1 hour')>=10 then raise exception 'Report request limit reached; retry later';end if;
 if p_kind='profile' then select p.owner_id,p.owner_id,p.public_fields into target,resource,snapshot from public.pilot_directory_profiles_internal() p where p.id=p_submission;
 elsif p_kind='offering' then select o.owner_id,s.source_listing_id,o.public_fields into target,resource,snapshot from public.pilot_directory_offerings_internal() o join public.listing_publication_submissions s on s.id=o.id where o.id=p_submission;
 else raise exception 'Unsupported report kind';end if;
 if target is null then raise exception 'Currently readable pilot copy required';end if;
 return query insert into public.marketplace_reports as r(reporter_id,target_owner_id,target_kind,target_submission_id,target_resource_id,public_snapshot,category,details)
 values(actor,target,p_kind,p_submission,resource,snapshot,p_category,clean) returning r.id,r.state,r.created_at;
end;
$$;
revoke all on function public.lock_marketplace_contact_pair(uuid,uuid),public.marketplace_contact_blocked(uuid,uuid),public.submit_marketplace_report(uuid,text,uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.submit_marketplace_report(uuid,text,uuid,text,text) to authenticated;
commit;
