-- Private versioned listing copies only. No public access or posting entitlement.
begin;
create table public.listing_publication_submissions (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 -- Deliberately retain the recorded copy if its editable draft is deleted.
 source_listing_id uuid not null,
 source_updated_at timestamptz not null,
 kind text not null check(kind in ('offering','looking')),
 recorded_fields jsonb not null check(jsonb_typeof(recorded_fields)='object'),
 submitted_at timestamptz not null default clock_timestamp(),
 withdrawn_at timestamptz,
 check(withdrawn_at is null or withdrawn_at>=submitted_at)
);
create unique index listing_publication_one_active on public.listing_publication_submissions(source_listing_id) where withdrawn_at is null;
create index listing_publication_owner_history on public.listing_publication_submissions(owner_id,submitted_at desc,id desc);
alter table public.listing_publication_submissions enable row level security;
alter table public.listing_publication_submissions force row level security;
revoke all on public.listing_publication_submissions from public,anon,authenticated,service_role;
grant select on public.listing_publication_submissions to authenticated;
create policy listing_submission_owner_read on public.listing_publication_submissions for select to authenticated using(owner_id=auth.uid());
create function public.submit_private_listing_copy(p_expected_owner uuid,p_listing uuid,p_source_updated_at timestamptz)
returns public.listing_publication_submissions language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();draft public.listing_drafts;result public.listing_publication_submissions;
begin
 if actor is null or p_expected_owner is distinct from actor then raise exception 'Owner changed or not authenticated'; end if;
 perform 1 from public.account_roles where user_id=actor and role in ('user','provider') order by role for share;
 if not exists(select 1 from public.account_roles where user_id=actor and role='user') then raise exception 'Current User membership required'; end if;
 select * into draft from public.listing_drafts where id=p_listing and owner_id=actor for update;
 if not found then raise exception 'Saved listing unavailable'; end if;
 if p_source_updated_at is null or draft.updated_at is distinct from p_source_updated_at then raise exception 'Saved listing changed; review again'; end if;
 if draft.kind='offering' and not exists(select 1 from public.account_roles where user_id=actor and role='provider') then raise exception 'Current Provider membership required for Offering submission'; end if;
 insert into public.listing_publication_submissions(owner_id,source_listing_id,source_updated_at,kind,recorded_fields)
 values(actor,draft.id,draft.updated_at,draft.kind,jsonb_build_object('title',draft.title,'description',draft.description,'city',draft.city,'area',draft.area,'activity',draft.activity)) returning * into result;
 return result;
end;
$$;
create function public.withdraw_private_listing_copy(p_expected_owner uuid,p_submission uuid)
returns public.listing_publication_submissions language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();result public.listing_publication_submissions;
begin
 if actor is null or p_expected_owner is distinct from actor then raise exception 'Owner changed or not authenticated'; end if;
 update public.listing_publication_submissions set withdrawn_at=clock_timestamp()
 where id=p_submission and owner_id=actor and withdrawn_at is null returning * into result;
 if not found then raise exception 'Active listing copy unavailable'; end if;
 return result;
end;
$$;
revoke all on function public.submit_private_listing_copy(uuid,uuid,timestamptz),public.withdraw_private_listing_copy(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.submit_private_listing_copy(uuid,uuid,timestamptz),public.withdraw_private_listing_copy(uuid,uuid) to authenticated;
commit;
