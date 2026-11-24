-- Onboard AI: auth bootstrap. Profiles, organizations, workspaces, membership, RLS.
-- A trigger on auth.users creates the profile, organization, default workspace and
-- owner memberships, so it works with or without email confirmation.

-- SAFETY GUARD for reused projects: stop before changing anything if these names are taken.
do $$
declare clash text;
begin
  select string_agg(c.relname, ', ') into clash
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','v','m')
    and c.relname in ('profiles','organizations','organization_members','workspaces','workspace_members');
  if clash is not null then
    raise exception 'Onboard AI migration stopped: public tables already exist (%). Run supabase/diagnostics/check_existing_project.sql and share the output before continuing.', clash;
  end if;
  if exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass) then
    raise exception 'Onboard AI migration stopped: trigger on_auth_user_created already exists on auth.users. Run supabase/diagnostics/check_existing_project.sql first.';
  end if;
end $$;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
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

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'recruiter'
    check (role in ('owner','admin','hr_manager','hiring_manager','recruiter','employee')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workspaces_org_idx on public.workspaces(organization_id);
create unique index workspaces_one_default_per_org on public.workspaces(organization_id) where is_default;

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger workspaces_updated before update on public.workspaces
  for each row execute function public.set_updated_at();

-- Membership helpers. SECURITY DEFINER avoids recursive RLS evaluation.
create or replace function public.is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members
                 where organization_id = org and user_id = auth.uid() and status = 'active');
$$;

create or replace function public.has_org_role(org uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members
                 where organization_id = org and user_id = auth.uid()
                   and status = 'active' and role = any(roles));
$$;

-- Signup bootstrap.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));
  v_org uuid;
  v_ws uuid;
  v_slug text;
begin
  insert into profiles (id, full_name, email) values (new.id, v_name, coalesce(new.email, ''));

  v_slug := lower(regexp_replace(split_part(coalesce(new.email, 'org'), '@', 1), '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into organizations (name, slug, created_by)
    values (v_name || '''s Organization', v_slug, new.id) returning id into v_org;
  insert into organization_members (organization_id, user_id, role) values (v_org, new.id, 'owner');

  insert into workspaces (organization_id, name, is_default) values (v_org, 'Default Workspace', true)
    returning id into v_ws;
  insert into workspace_members (workspace_id, user_id, role) values (v_ws, new.id, 'admin');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from organization_members a join organization_members b on a.organization_id = b.organization_id
    where a.user_id = auth.uid() and b.user_id = profiles.id and a.status = 'active'));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy orgs_select on public.organizations for select to authenticated
  using (public.is_org_member(id));
create policy orgs_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner','admin']))
  with check (public.has_org_role(id, array['owner','admin']));

create policy org_members_select on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_members_manage on public.organization_members for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']))
  with check (public.has_org_role(organization_id, array['owner','admin']));

create policy workspaces_select on public.workspaces for select to authenticated
  using (public.is_org_member(organization_id));
create policy workspaces_manage on public.workspaces for all to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']))
  with check (public.has_org_role(organization_id, array['owner','admin']));

create policy ws_members_select on public.workspace_members for select to authenticated
  using (exists (select 1 from workspaces w where w.id = workspace_id and public.is_org_member(w.organization_id)));
create policy ws_members_manage on public.workspace_members for all to authenticated
  using (exists (select 1 from workspaces w where w.id = workspace_id
                 and public.has_org_role(w.organization_id, array['owner','admin'])))
  with check (exists (select 1 from workspaces w where w.id = workspace_id
                 and public.has_org_role(w.organization_id, array['owner','admin'])));
