-- Voluntary single-message evidence only; no staff conversation browsing grant.
begin;
create function public.submit_marketplace_message_report(p_expected_actor uuid,p_conversation uuid,p_message uuid,p_category text,p_details text)
returns table(id uuid,state text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();c public.marketplace_conversations;m public.marketplace_messages;existing public.marketplace_reports;clean text;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed';end if;
 if p_category is null or p_category not in ('safety','harassment','impersonation','content','other') then raise exception 'Invalid category';end if;
 clean:=btrim(p_details);if clean is null or char_length(clean)<1 or char_length(clean)>2000 then raise exception 'Report details must contain 1 to 2000 characters';end if;
 select * into c from public.marketplace_conversations where marketplace_conversations.id=p_conversation;
 if not found or actor not in (c.member_id,c.provider_id) then raise exception 'Conversation membership required';end if;
 select * into m from public.marketplace_messages where marketplace_messages.id=p_message and conversation_id=c.id;
 if not found or m.sender_id=actor then raise exception 'A received message from this conversation is required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-report:'||actor::text,0));
 select * into existing from public.marketplace_reports r where r.reporter_id=actor and r.target_kind='message' and r.target_submission_id=m.id and r.state<>'closed';
 if found then return query select existing.id,existing.state,existing.created_at;return;end if;
 if (select count(*) from public.marketplace_reports r where r.reporter_id=actor and r.created_at>statement_timestamp()-interval '1 hour')>=10 then raise exception 'Report request limit reached; retry later';end if;
 return query insert into public.marketplace_reports as r(reporter_id,target_owner_id,target_kind,target_submission_id,target_resource_id,public_snapshot,category,details)
 values(actor,m.sender_id,'message',m.id,c.id,jsonb_build_object('reported_message',m.body,'sent_at',m.sent_at),p_category,clean) returning r.id,r.state,r.created_at;
end;
$$;
revoke all on function public.submit_marketplace_message_report(uuid,uuid,uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.submit_marketplace_message_report(uuid,uuid,uuid,text,text) to authenticated;
commit;
