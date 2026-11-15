-- DEC-026: explicit expiring pilot pairs, retained read-only history, bilateral block.
begin;
create table public.marketplace_pilot_service_settings (
 id text primary key check(id in ('text_messaging','booking_requests')),
 enabled boolean not null default false
);
insert into public.marketplace_pilot_service_settings(id,enabled) values('text_messaging',false),('booking_requests',false);
alter table public.marketplace_pilot_service_settings enable row level security;
alter table public.marketplace_pilot_service_settings force row level security;
revoke all on public.marketplace_pilot_service_settings from public,anon,authenticated,service_role;
grant select,update on public.marketplace_pilot_service_settings to service_role;
create function public.get_marketplace_contact_service_status()
returns table(text_messaging boolean,booking_requests boolean)
language sql stable security definer set search_path='' as $$
 select coalesce((select enabled from public.marketplace_pilot_service_settings where id='text_messaging'),false),
 coalesce((select enabled from public.marketplace_pilot_service_settings where id='booking_requests'),false);
$$;
alter table public.staff_capabilities drop constraint staff_capabilities_capability_check;
alter table public.staff_capabilities add constraint staff_capabilities_capability_check check(capability in ('provider_application_review','provider_application_feedback','provider_application_approval','profile_publication_review','profile_publication_feedback','marketplace_publication_approval','listing_publication_review','marketplace_pilot_management','marketplace_messaging_pilot_management','marketplace_report_review'));
create table public.marketplace_messaging_access (
 member_id uuid not null references auth.users(id) on delete cascade,
 provider_id uuid not null references auth.users(id) on delete cascade,
 valid_until timestamptz not null,revoked_at timestamptz,
 revision uuid not null default gen_random_uuid(),
 primary key(member_id,provider_id),check(member_id<>provider_id)
);
create table public.marketplace_conversations (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references auth.users(id) on delete cascade,
 provider_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp(),
 unique(member_id,provider_id),check(member_id<>provider_id)
);
create table public.marketplace_messages (
 id uuid primary key default gen_random_uuid(),
 sequence bigint generated always as identity unique,
 conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null,
 body text not null check(char_length(btrim(body)) between 1 and 2000),
 sent_at timestamptz not null default clock_timestamp(),
 unique(conversation_id,sender_id,client_id)
);
create index marketplace_message_history on public.marketplace_messages(conversation_id,sequence desc);
create table public.marketplace_messaging_events (
 event_id bigint generated always as identity primary key,actor_id uuid not null,
 member_id uuid not null,provider_id uuid not null,
 action text not null check(action in ('access_opened','access_granted','access_revoked')),
 valid_until timestamptz,occurred_at timestamptz not null default clock_timestamp()
);
alter table public.marketplace_messaging_access enable row level security;
alter table public.marketplace_messaging_access force row level security;
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_conversations force row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_messages force row level security;
alter table public.marketplace_messaging_events enable row level security;
alter table public.marketplace_messaging_events force row level security;
revoke all on public.marketplace_messaging_access,public.marketplace_conversations,public.marketplace_messages,public.marketplace_messaging_events from public,anon,authenticated,service_role;
grant select on public.marketplace_messaging_events to service_role;
create function public.can_manage_messaging_pilot() returns boolean language sql stable security invoker set search_path='' as $$
 select public.has_account_role('admin') and exists(select 1 from public.staff_capabilities where user_id=auth.uid() and capability='marketplace_messaging_pilot_management');
$$;
create function public.can_send_marketplace_text(p_member uuid,p_provider uuid) returns boolean language sql volatile security definer set search_path='' as $$
 select exists(select 1 from public.marketplace_pilot_service_settings where id='text_messaging' and enabled)
 and exists(select 1 from public.marketplace_messaging_access a where a.member_id=p_member and a.provider_id=p_provider and a.revoked_at is null and a.valid_until>clock_timestamp())
 and exists(select 1 from public.account_roles r where r.user_id=p_member and r.role='user')
 and exists(select 1 from public.account_roles r where r.user_id=p_provider and r.role='user')
 and exists(select 1 from public.account_roles r where r.user_id=p_provider and r.role='provider')
 and not public.marketplace_contact_blocked(p_member,p_provider);
$$;
create function public.inspect_messaging_pilot_pair(p_expected_actor uuid,p_member uuid,p_provider uuid)
returns table(member_id uuid,provider_id uuid,members_valid boolean,revision uuid,valid_until timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Administrator changed';end if;
 if not public.can_manage_messaging_pilot() then raise exception 'Assigned messaging pilot access required';end if;
 if p_member is null or p_provider is null or p_member=p_provider then raise exception 'Distinct pair required';end if;
 insert into public.marketplace_messaging_events(actor_id,member_id,provider_id,action) values(auth.uid(),p_member,p_provider,'access_opened');
 return query select p_member,p_provider,
 exists(select 1 from public.account_roles where user_id=p_member and role='user') and exists(select 1 from public.account_roles where user_id=p_provider and role='user') and exists(select 1 from public.account_roles where user_id=p_provider and role='provider'),
 a.revision,a.valid_until,a.revoked_at from (select 1) seed left join public.marketplace_messaging_access a on a.member_id=p_member and a.provider_id=p_provider;
end;
$$;
create function public.set_messaging_pilot_pair(p_expected_actor uuid,p_member uuid,p_provider uuid,p_expected_revision uuid,p_until timestamptz,p_revoke boolean)
returns table(revision uuid,valid_until timestamptz,revoked_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();old public.marketplace_messaging_access;result public.marketplace_messaging_access;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Administrator changed';end if;
 if actor in (p_member,p_provider) or p_member is null or p_provider is null or p_member=p_provider or p_revoke is null then raise exception 'Explicit independent invited pair required';end if;
 perform 1 from public.account_roles where user_id=actor and role='admin' for share;
 perform 1 from public.staff_capabilities where user_id=actor and capability='marketplace_messaging_pilot_management' for share;
 if not public.can_manage_messaging_pilot() then raise exception 'Assigned messaging pilot access required';end if;
 perform public.lock_marketplace_contact_pair(p_member,p_provider);
 select * into old from public.marketplace_messaging_access a where a.member_id=p_member and a.provider_id=p_provider for update;
 if old.revision is distinct from p_expected_revision then raise exception 'Pair access changed; inspect again';end if;
 if p_revoke then
  if old.member_id is null or old.revoked_at is not null then raise exception 'Current pair access required';end if;
  update public.marketplace_messaging_access a set revoked_at=clock_timestamp(),revision=gen_random_uuid() where a.member_id=p_member and a.provider_id=p_provider returning * into result;
 else
  if p_until is null or not pg_catalog.isfinite(p_until) or p_until<=clock_timestamp() then raise exception 'Explicit future expiry required';end if;
  perform 1 from public.account_roles where user_id in (p_member,p_provider) and role in ('user','provider') order by user_id,role for share;
  if not exists(select 1 from public.account_roles where user_id=p_member and role='user') or not exists(select 1 from public.account_roles where user_id=p_provider and role='user') or not exists(select 1 from public.account_roles where user_id=p_provider and role='provider') then raise exception 'Current User and Provider pair membership required';end if;
  if old.member_id is null then
   insert into public.marketplace_messaging_access(member_id,provider_id,valid_until) values(p_member,p_provider,p_until) returning * into result;
  else update public.marketplace_messaging_access a set valid_until=p_until,revoked_at=null,revision=gen_random_uuid() where a.member_id=p_member and a.provider_id=p_provider returning * into result;end if;
  insert into public.marketplace_conversations(member_id,provider_id) values(p_member,p_provider) on conflict(member_id,provider_id) do nothing;
 end if;
 insert into public.marketplace_messaging_events(actor_id,member_id,provider_id,action,valid_until) values(actor,p_member,p_provider,case when p_revoke then 'access_revoked' else 'access_granted' end,result.valid_until);
 return query select result.revision,result.valid_until,result.revoked_at;
end;
$$;
create function public.list_my_marketplace_conversations(p_expected_actor uuid,p_after_id uuid default null)
returns table(id uuid,peer_label text,can_send boolean,blocked_by_me boolean,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 return query select c.id,case when c.provider_id=auth.uid() then 'Pilot member' else 'Pilot Provider' end,
 public.can_send_marketplace_text(c.member_id,c.provider_id),
 exists(select 1 from public.marketplace_blocks b where b.owner_id=auth.uid() and b.target_id=case when c.member_id=auth.uid() then c.provider_id else c.member_id end),c.created_at
 from public.marketplace_conversations c where auth.uid() in (c.member_id,c.provider_id) and (p_after_id is null or c.id>p_after_id) order by c.id limit 21;
end;
$$;
create function public.read_marketplace_messages(p_expected_actor uuid,p_conversation uuid,p_before bigint default null)
returns table(id uuid,sequence bigint,sent_by_me boolean,body text,sent_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 if not exists(select 1 from public.marketplace_conversations c where c.id=p_conversation and auth.uid() in (c.member_id,c.provider_id)) then raise exception 'Conversation membership required';end if;
 return query select m.id,m.sequence,m.sender_id=auth.uid(),m.body,m.sent_at from public.marketplace_messages m where m.conversation_id=p_conversation and (p_before is null or m.sequence<p_before) order by m.sequence desc limit 51;
end;
$$;
create function public.send_marketplace_text(p_expected_actor uuid,p_conversation uuid,p_client_id uuid,p_body text)
returns table(id uuid,sequence bigint,sent_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();c public.marketplace_conversations;existing public.marketplace_messages;result public.marketplace_messages;clean text;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed';end if;
 select * into c from public.marketplace_conversations where marketplace_conversations.id=p_conversation;
 if not found or actor not in (c.member_id,c.provider_id) then raise exception 'Conversation membership required';end if;
 clean:=btrim(p_body);if clean is null or char_length(clean)<1 or char_length(clean)>2000 or p_client_id is null then raise exception 'Text must contain 1 to 2000 characters and a request ID';end if;
 perform public.lock_marketplace_contact_pair(c.member_id,c.provider_id);
 select * into existing from public.marketplace_messages m where m.conversation_id=c.id and m.sender_id=actor and m.client_id=p_client_id;
 if found then
  if existing.body<>clean then raise exception 'Request ID already used for different text';end if;
  return query select existing.id,existing.sequence,existing.sent_at;return;
 end if;
 perform 1 from public.account_roles where user_id in (c.member_id,c.provider_id) and role in ('user','provider') order by user_id,role for share;
 perform 1 from public.marketplace_messaging_access a where a.member_id=c.member_id and a.provider_id=c.provider_id for share;
 perform 1 from public.marketplace_pilot_service_settings where marketplace_pilot_service_settings.id='text_messaging' for share;
 if not public.can_send_marketplace_text(c.member_id,c.provider_id) then raise exception 'Current text access required; contact unavailable';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-message-sender:'||actor::text,0));
 if (select count(*) from public.marketplace_messages m where m.sender_id=actor and m.sent_at>statement_timestamp()-interval '1 minute')>=20 then raise exception 'Message request limit reached; retry later';end if;
 insert into public.marketplace_messages(conversation_id,sender_id,client_id,body) values(c.id,actor,p_client_id,clean) returning * into result;
 return query select result.id,result.sequence,result.sent_at;
end;
$$;
create function public.set_marketplace_conversation_block(p_expected_actor uuid,p_conversation uuid,p_block boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();c public.marketplace_conversations;peer uuid;
begin
 if actor is null or actor is distinct from p_expected_actor or p_block is null then raise exception 'Account changed or explicit action missing';end if;
 select * into c from public.marketplace_conversations where marketplace_conversations.id=p_conversation;
 if not found or actor not in (c.member_id,c.provider_id) then raise exception 'Conversation membership required';end if;
 peer:=case when c.member_id=actor then c.provider_id else c.member_id end;
 perform public.lock_marketplace_contact_pair(actor,peer);
 if p_block then insert into public.marketplace_blocks(owner_id,target_id) values(actor,peer) on conflict(owner_id,target_id) do nothing;
 else delete from public.marketplace_blocks b where b.owner_id=actor and b.target_id=peer;end if;
 return p_block;
end;
$$;
revoke all on function public.get_marketplace_contact_service_status() from public,anon,authenticated,service_role;
grant execute on function public.get_marketplace_contact_service_status() to authenticated;
revoke all on function public.can_manage_messaging_pilot(),public.can_send_marketplace_text(uuid,uuid),public.inspect_messaging_pilot_pair(uuid,uuid,uuid),public.set_messaging_pilot_pair(uuid,uuid,uuid,uuid,timestamptz,boolean),public.list_my_marketplace_conversations(uuid,uuid),public.read_marketplace_messages(uuid,uuid,bigint),public.send_marketplace_text(uuid,uuid,uuid,text),public.set_marketplace_conversation_block(uuid,uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function public.can_manage_messaging_pilot(),public.inspect_messaging_pilot_pair(uuid,uuid,uuid),public.set_messaging_pilot_pair(uuid,uuid,uuid,uuid,timestamptz,boolean),public.list_my_marketplace_conversations(uuid,uuid),public.read_marketplace_messages(uuid,uuid,bigint),public.send_marketplace_text(uuid,uuid,uuid,text),public.set_marketplace_conversation_block(uuid,uuid,boolean) to authenticated;
commit;
