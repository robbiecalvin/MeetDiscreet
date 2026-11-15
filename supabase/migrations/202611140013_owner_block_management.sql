begin;
alter table public.marketplace_blocks add column id uuid not null default gen_random_uuid() unique;
alter table public.marketplace_blocks add column context_label text not null default 'Blocked participant' check(char_length(context_label)<=120);
create function public.set_pilot_entry_block(p_expected_actor uuid,p_kind text,p_submission uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();target uuid;label text;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed';end if;
 if p_kind='profile' then select p.owner_id,left(coalesce(nullif(p.public_fields->>'display_name',''),nullif(p.public_fields->>'username',''),'Pilot Provider'),120) into target,label from public.pilot_directory_profiles_internal() p where p.id=p_submission;
 elsif p_kind='offering' then select o.owner_id,'Pilot Offering · '||left(o.id::text,8) into target,label from public.pilot_directory_offerings_internal() o where o.id=p_submission;
 else raise exception 'Unsupported pilot entry';end if;
 if target is null then raise exception 'Currently readable pilot entry required';end if;
 perform public.lock_marketplace_contact_pair(actor,target);
 insert into public.marketplace_blocks(owner_id,target_id,context_label) values(actor,target,label) on conflict(owner_id,target_id) do nothing;
 return true;
end;
$$;
create function public.list_my_marketplace_blocks(p_expected_actor uuid,p_after_id uuid default null)
returns table(id uuid,context_label text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from p_expected_actor then raise exception 'Account changed';end if;
 return query select b.id,b.context_label,b.created_at from public.marketplace_blocks b where b.owner_id=auth.uid() and (p_after_id is null or b.id>p_after_id) order by b.id limit 21;
end;
$$;
create function public.remove_my_marketplace_block(p_expected_actor uuid,p_block uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();target uuid;
begin
 if actor is null or actor is distinct from p_expected_actor then raise exception 'Account changed';end if;
 select b.target_id into target from public.marketplace_blocks b where b.id=p_block and b.owner_id=actor;
 if target is null then return false;end if;
 perform public.lock_marketplace_contact_pair(actor,target);
 delete from public.marketplace_blocks b where b.id=p_block and b.owner_id=actor;
 return true;
end;
$$;
create or replace function public.set_marketplace_conversation_block(p_expected_actor uuid,p_conversation uuid,p_block boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();c public.marketplace_conversations;peer uuid;
begin
 if actor is null or actor is distinct from p_expected_actor or p_block is null then raise exception 'Account changed or explicit action missing';end if;
 select * into c from public.marketplace_conversations where marketplace_conversations.id=p_conversation;
 if not found or actor not in (c.member_id,c.provider_id) then raise exception 'Conversation membership required';end if;
 peer:=case when c.member_id=actor then c.provider_id else c.member_id end;
 perform public.lock_marketplace_contact_pair(actor,peer);
 if p_block then insert into public.marketplace_blocks(owner_id,target_id,context_label) values(actor,peer,(case when c.provider_id=actor then 'Pilot member · ' else 'Pilot Provider · ' end)||left(c.id::text,8)) on conflict(owner_id,target_id) do nothing;
 else delete from public.marketplace_blocks b where b.owner_id=actor and b.target_id=peer;end if;
 return p_block;
end;
$$;
revoke all on function public.set_pilot_entry_block(uuid,text,uuid),public.list_my_marketplace_blocks(uuid,uuid),public.remove_my_marketplace_block(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.set_pilot_entry_block(uuid,text,uuid),public.list_my_marketplace_blocks(uuid,uuid),public.remove_my_marketplace_block(uuid,uuid) to authenticated;
commit;
