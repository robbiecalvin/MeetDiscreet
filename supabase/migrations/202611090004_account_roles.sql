begin;
-- Membership roles are controlled by trusted database/server operations.
-- Signup metadata and paid entitlements never grant roles.
create table public.account_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'provider', 'moderator', 'admin')),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.account_roles enable row level security;
alter table public.account_roles force row level security;
revoke all on public.account_roles from public, anon, authenticated;
grant select on public.account_roles to authenticated;
grant select, insert, update, delete on public.account_roles to service_role;
create policy account_role_owner_read on public.account_roles for select to authenticated
  using ((select auth.uid()) = user_id);

-- Invoker security keeps this helper within the caller's owner-only read policy.
create function public.has_account_role(required_role text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select 1 from public.account_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;
revoke all on function public.has_account_role(text) from public, anon, authenticated;
grant execute on function public.has_account_role(text) to authenticated;

-- Application clients and service APIs cannot rewrite role audit events.
-- Operational retention/export policy remains a launch dependency.
create table public.account_role_events (
  event_id bigint generated always as identity primary key,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_user_id uuid,
  new_user_id uuid,
  old_role text,
  new_role text,
  actor_user_id uuid,
  actor_database_role text not null,
  occurred_at timestamptz not null default now()
);
alter table public.account_role_events enable row level security;
alter table public.account_role_events force row level security;
revoke all on public.account_role_events from public, anon, authenticated, service_role;
grant select on public.account_role_events to service_role;
create function public.audit_account_role_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_role_events(action, old_user_id, new_user_id, old_role, new_role, actor_user_id, actor_database_role)
  values (tg_op,
    case when tg_op <> 'INSERT' then old.user_id else null end,
    case when tg_op <> 'DELETE' then new.user_id else null end,
    case when tg_op <> 'INSERT' then old.role else null end,
    case when tg_op <> 'DELETE' then new.role else null end,
    auth.uid(), coalesce(nullif(current_setting('role', true), 'none'), session_user));
  return null;
end;
$$;
revoke all on function public.audit_account_role_change() from public, anon, authenticated, service_role;
create trigger account_role_changed after insert or update or delete on public.account_roles
  for each row execute function public.audit_account_role_change();

create function public.initialize_account_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_roles(user_id, role) values (new.id, 'user')
    on conflict (user_id, role) do nothing;
  return new;
end;
$$;
revoke all on function public.initialize_account_role() from public, anon, authenticated, service_role;
create trigger initialize_account_role after insert on auth.users
  for each row execute function public.initialize_account_role();
insert into public.account_roles(user_id, role)
  select id, 'user' from auth.users on conflict (user_id, role) do nothing;
commit;
