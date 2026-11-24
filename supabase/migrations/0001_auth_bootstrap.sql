-- Onboard AI: auth bootstrap. Every object is prefixed oa_ because this Supabase project is shared
-- with other apps (public.profiles, public.workspaces etc. already belong to them).

-- SAFETY GUARD for reused projects: stop before changing anything if these names are taken.
do $$
declare clash text;
begin
  select string_agg(c.relname, ', ') into clash
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','v','m')
    and c.relname in ('oa_profiles','oa_organizations','oa_organization_members','oa_workspaces','oa_workspace_members');
  if clash is not null then
    raise exception 'Onboard AI migration stopped: public tables already exist (%). Run supabase/diagnostics/check_existing_project.sql and share the output before continuing.', clash;
  end if;
  if exists (select 1 from pg_trigger where tgname = 'oa_on_auth_user_created' and tgrelid = 'auth.users'::regclass) then
    raise exception 'Onboard AI migration stopped: trigger oa_on_auth_user_created already exists on auth.users. Run supabase/diagnostics/check_existing_project.sql first.';
  end if;
end $$;

create extension if not exists pgcrypto;

create or replace function public.oa_set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table public.oa_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.oa_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  industry text,
  company_size text,
  hiring_volume text,
  recruitment_team_size text,
  challenges text[] not null default '{}',
  preferred_channels text[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.oa_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'recruiter'
    check (role in ('owner','admin','hr_manager','hiring_manager','recruiter','employee')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index oa_organization_members_user_idx on public.oa_organization_members(user_id);

create table public.oa_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index oa_workspaces_org_idx on public.oa_workspaces(organization_id);
create unique index oa_workspaces_one_default_per_org on public.oa_workspaces(organization_id) where is_default;

create table public.oa_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.oa_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index oa_workspace_members_user_idx on public.oa_workspace_members(user_id);

create trigger oa_profiles_updated before update on public.oa_profiles
  for each row execute function public.oa_set_updated_at();
create trigger oa_organizations_updated before update on public.oa_organizations
  for each row execute function public.oa_set_updated_at();
create trigger oa_workspaces_updated before update on public.oa_workspaces
  for each row execute function public.oa_set_updated_at();

-- Membership helpers. SECURITY DEFINER avoids recursive RLS evaluation.
create or replace function public.oa_is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from oa_organization_members
                 where organization_id = org and user_id = auth.uid() and status = 'active');
$$;

create or replace function public.oa_has_org_role(org uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from oa_organization_members
                 where organization_id = org and user_id = auth.uid()
                   and status = 'active' and role = any(roles));
$$;

-- Account bootstrap. Idempotent: does nothing if the user already has an Onboard AI account.
create or replace function public.oa_bootstrap_user(p_user uuid) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  u auth.users%rowtype;
  v_name text;
  v_org uuid;
  v_ws uuid;
begin
  select * into u from auth.users where id = p_user;
  if not found then return null; end if;

  select organization_id into v_org from oa_organization_members
    where user_id = p_user and role = 'owner' order by created_at limit 1;
  if v_org is not null then return v_org; end if;

  v_name := coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1));
  insert into oa_profiles (id, full_name, email) values (u.id, v_name, coalesce(u.email, ''))
    on conflict (id) do nothing;

  insert into oa_organizations (name, slug, created_by) values (
    v_name || '''s Organization',
    lower(regexp_replace(split_part(coalesce(u.email, 'org'), '@', 1), '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    u.id) returning id into v_org;
  insert into oa_organization_members (organization_id, user_id, role) values (v_org, u.id, 'owner');

  insert into oa_workspaces (organization_id, name, is_default) values (v_org, 'Default Workspace', true)
    returning id into v_ws;
  insert into oa_workspace_members (workspace_id, user_id, role) values (v_ws, u.id, 'admin');
  return v_org;
end $$;

-- Trigger wrapper. This project is shared with other apps whose triggers also run on signup,
-- so a failure here must never block account creation. The app calls oa_ensure_my_account()
-- as a fallback, which also sets up existing users from other apps on first login.
create or replace function public.oa_handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  begin
    perform public.oa_bootstrap_user(new.id);
  exception when others then
    raise warning 'oa_handle_new_user failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;

create trigger oa_on_auth_user_created after insert on auth.users
  for each row execute function public.oa_handle_new_user();

-- Callable by the signed in user only, for themselves only.
create or replace function public.oa_ensure_my_account() returns uuid
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  return public.oa_bootstrap_user(auth.uid());
end $$;

revoke all on function public.oa_bootstrap_user(uuid) from public, anon, authenticated;
revoke all on function public.oa_handle_new_user() from public, anon, authenticated;
revoke all on function public.oa_ensure_my_account() from public, anon;
grant execute on function public.oa_ensure_my_account() to authenticated;

-- Row Level Security
alter table public.oa_profiles enable row level security;
alter table public.oa_organizations enable row level security;
alter table public.oa_organization_members enable row level security;
alter table public.oa_workspaces enable row level security;
alter table public.oa_workspace_members enable row level security;

create policy profiles_select on public.oa_profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from oa_organization_members a join oa_organization_members b on a.organization_id = b.organization_id
    where a.user_id = auth.uid() and b.user_id = oa_profiles.id and a.status = 'active'));
create policy profiles_update on public.oa_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy orgs_select on public.oa_organizations for select to authenticated
  using (public.oa_is_org_member(id));
create policy orgs_update on public.oa_organizations for update to authenticated
  using (public.oa_has_org_role(id, array['owner','admin']))
  with check (public.oa_has_org_role(id, array['owner','admin']));

create policy org_members_select on public.oa_organization_members for select to authenticated
  using (public.oa_is_org_member(organization_id));
create policy org_members_manage on public.oa_organization_members for all to authenticated
  using (public.oa_has_org_role(organization_id, array['owner','admin']))
  with check (public.oa_has_org_role(organization_id, array['owner','admin']));

create policy workspaces_select on public.oa_workspaces for select to authenticated
  using (public.oa_is_org_member(organization_id));
create policy workspaces_manage on public.oa_workspaces for all to authenticated
  using (public.oa_has_org_role(organization_id, array['owner','admin']))
  with check (public.oa_has_org_role(organization_id, array['owner','admin']));

create policy ws_members_select on public.oa_workspace_members for select to authenticated
  using (exists (select 1 from oa_workspaces w where w.id = workspace_id and public.oa_is_org_member(w.organization_id)));
create policy ws_members_manage on public.oa_workspace_members for all to authenticated
  using (exists (select 1 from oa_workspaces w where w.id = workspace_id
                 and public.oa_has_org_role(w.organization_id, array['owner','admin'])))
  with check (exists (select 1 from oa_workspaces w where w.id = workspace_id
                 and public.oa_has_org_role(w.organization_id, array['owner','admin'])));
