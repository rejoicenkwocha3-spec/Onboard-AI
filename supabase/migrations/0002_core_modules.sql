-- Onboard AI core modules. Everything is prefixed oa_ (shared Supabase project).
-- Run AFTER 0001_auth_bootstrap.sql.

create or replace function public.oa_can_write(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.oa_has_org_role(org, array['owner','admin','hr_manager','recruiter']);
$$;
create or replace function public.oa_is_admin(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.oa_has_org_role(org, array['owner','admin']);
$$;

create table public.oa_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  title text not null,
  department text,
  location text,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time','part_time','contract','temporary','internship')),
  salary_min integer, salary_max integer, salary_currency text not null default 'USD',
  description text, requirements text, qualifications text,
  status text not null default 'draft' check (status in ('draft','published','paused','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index oa_jobs_org_status_idx on public.oa_jobs(organization_id, status);

create table public.oa_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  job_id uuid references public.oa_jobs(id) on delete set null,
  full_name text not null, email text not null, phone text,
  skills text[] not null default '{}', experience text, qualifications text, notes text,
  source text not null default 'manual',
  stage text not null default 'new_applicant' check (stage in
    ('new_applicant','screening','shortlisted','interview','assessment','offer','hired','not_selected','withdrawn')),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index oa_candidates_org_stage_idx on public.oa_candidates(organization_id, stage);
create index oa_candidates_job_idx on public.oa_candidates(job_id);
create unique index oa_candidates_one_application on public.oa_candidates(organization_id, job_id, lower(email)) where job_id is not null;

create table public.oa_candidate_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  candidate_id uuid not null references public.oa_candidates(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null, detail text, created_at timestamptz not null default now()
);
create index oa_candidate_events_cand_idx on public.oa_candidate_events(candidate_id, created_at desc);

create table public.oa_screening_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  job_id uuid not null references public.oa_jobs(id) on delete cascade,
  question text not null, required boolean not null default true,
  min_answer text, position integer not null default 0,
  created_at timestamptz not null default now()
);
create index oa_screening_questions_job_idx on public.oa_screening_questions(job_id);

create table public.oa_screening_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  candidate_id uuid not null references public.oa_candidates(id) on delete cascade,
  question_id uuid not null references public.oa_screening_questions(id) on delete cascade,
  answer text not null default '', created_at timestamptz not null default now(),
  unique (candidate_id, question_id)
);

create table public.oa_interviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  candidate_id uuid not null references public.oa_candidates(id) on delete cascade,
  job_id uuid references public.oa_jobs(id) on delete set null,
  scheduled_at timestamptz not null, duration_minutes integer not null default 30,
  interviewer text, location text, notes text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index oa_interviews_org_time_idx on public.oa_interviews(organization_id, scheduled_at);

create table public.oa_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  candidate_id uuid references public.oa_candidates(id) on delete set null,
  channel text not null default 'internal' check (channel in ('website_chat','email','sms','whatsapp','internal')),
  subject text not null default '',
  status text not null default 'open' check (status in ('open','closed','handoff')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), last_message_at timestamptz not null default now()
);
create index oa_conversations_org_idx on public.oa_conversations(organization_id, last_message_at desc);

create table public.oa_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  conversation_id uuid not null references public.oa_conversations(id) on delete cascade,
  direction text not null default 'internal' check (direction in ('inbound','outbound','internal')),
  body text not null, sender_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index oa_messages_conv_idx on public.oa_messages(conversation_id, created_at);

create table public.oa_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  name text not null, personality text, tone text, language text not null default 'English',
  instructions text, escalation_rules text,
  channels text[] not null default '{}', approved_actions text[] not null default '{}',
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now()
);

create table public.oa_onboarding_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  name text not null, department text, tasks text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.oa_onboarding_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  candidate_id uuid references public.oa_candidates(id) on delete set null,
  template_id uuid references public.oa_onboarding_templates(id) on delete set null,
  employee_name text not null, employee_email text not null, start_date date,
  status text not null default 'active' check (status in ('active','completed')),
  created_at timestamptz not null default now()
);
create index oa_onboarding_proc_email_idx on public.oa_onboarding_processes(lower(employee_email));

create table public.oa_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  process_id uuid not null references public.oa_onboarding_processes(id) on delete cascade,
  title text not null, due_date date,
  status text not null default 'pending' check (status in ('pending','completed')),
  completed_at timestamptz, position integer not null default 0
);
create index oa_onboarding_tasks_proc_idx on public.oa_onboarding_tasks(process_id);

create table public.oa_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  name text not null,
  category text not null default 'other' check (category in
    ('resume','offer_letter','employee_document','policy','onboarding','training','job_description','other')),
  storage_path text not null, mime_type text, size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index oa_documents_org_idx on public.oa_documents(organization_id, created_at desc);

create table public.oa_workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  name text not null, trigger text not null default 'application_submitted',
  steps text[] not null default '{}', enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.oa_career_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.oa_organizations(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  headline text not null default '', description text not null default '',
  brand_color text not null default '#2563EB' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.oa_hiring_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  title text not null, event_type text not null default 'virtual' check (event_type in ('virtual','in_person')),
  starts_at timestamptz not null, location text, description text, capacity integer,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table public.oa_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  email text not null,
  role text not null default 'recruiter' check (role in ('admin','hr_manager','hiring_manager','recruiter','employee')),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.oa_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null, entity text, entity_id uuid, detail text,
  created_at timestamptz not null default now()
);
create index oa_audit_logs_org_idx on public.oa_audit_logs(organization_id, created_at desc);

create table public.oa_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  plan_ref text, status text not null default 'inactive',
  provider text not null default 'selar', provider_ref text, current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.oa_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.oa_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null, provider text, created_at timestamptz not null default now()
);
create index oa_usage_events_org_idx on public.oa_usage_events(organization_id, kind, created_at desc);

create trigger oa_jobs_updated before update on public.oa_jobs for each row execute function public.oa_set_updated_at();
create trigger oa_candidates_updated before update on public.oa_candidates for each row execute function public.oa_set_updated_at();
create trigger oa_career_pages_updated before update on public.oa_career_pages for each row execute function public.oa_set_updated_at();

-- Row Level Security: members read their organization's rows; writers (owner, admin, hr_manager, recruiter) write.
do $$
declare t text;
begin
  foreach t in array array['oa_jobs','oa_candidates','oa_candidate_events','oa_screening_questions',
    'oa_screening_responses','oa_interviews','oa_conversations','oa_messages','oa_agents',
    'oa_onboarding_templates','oa_onboarding_processes','oa_onboarding_tasks','oa_documents',
    'oa_workflows','oa_career_pages','oa_hiring_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.oa_is_org_member(organization_id))', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.oa_can_write(organization_id))', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.oa_can_write(organization_id)) with check (public.oa_can_write(organization_id))', t||'_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.oa_can_write(organization_id))', t||'_del', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

alter table public.oa_audit_logs enable row level security;
create policy oa_audit_sel on public.oa_audit_logs for select to authenticated using (public.oa_is_org_member(organization_id));
create policy oa_audit_ins on public.oa_audit_logs for insert to authenticated with check (public.oa_is_org_member(organization_id) and actor_id = auth.uid());
grant select, insert on public.oa_audit_logs to authenticated;

alter table public.oa_usage_events enable row level security;
create policy oa_usage_sel on public.oa_usage_events for select to authenticated using (public.oa_is_org_member(organization_id));
create policy oa_usage_ins on public.oa_usage_events for insert to authenticated with check (public.oa_is_org_member(organization_id) and user_id = auth.uid());
grant select, insert on public.oa_usage_events to authenticated;

alter table public.oa_subscriptions enable row level security;
create policy oa_subs_sel on public.oa_subscriptions for select to authenticated using (public.oa_is_org_member(organization_id));
grant select on public.oa_subscriptions to authenticated;

alter table public.oa_invitations enable row level security;
create policy oa_inv_all on public.oa_invitations for all to authenticated
  using (public.oa_is_admin(organization_id)) with check (public.oa_is_admin(organization_id));
grant select, insert, update, delete on public.oa_invitations to authenticated;

-- Employees can see and complete their own onboarding by email.
create policy oa_proc_employee_sel on public.oa_onboarding_processes for select to authenticated
  using (lower(employee_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy oa_task_employee_sel on public.oa_onboarding_tasks for select to authenticated
  using (exists (select 1 from public.oa_onboarding_processes p where p.id = process_id
    and lower(p.employee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy oa_task_employee_upd on public.oa_onboarding_tasks for update to authenticated
  using (exists (select 1 from public.oa_onboarding_processes p where p.id = process_id
    and lower(p.employee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.oa_onboarding_processes p where p.id = process_id
    and lower(p.employee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

-- Public career page and application (anonymous visitors, no direct table access).
create or replace function public.oa_public_career_page(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare cp public.oa_career_pages; org_name text;
begin
  select * into cp from oa_career_pages where slug = lower(p_slug) and published;
  if not found then return null; end if;
  select name into org_name from oa_organizations where id = cp.organization_id;
  return jsonb_build_object('company', org_name, 'headline', cp.headline, 'description', cp.description,
    'brand_color', cp.brand_color,
    'jobs', coalesce((select jsonb_agg(jsonb_build_object('id', j.id, 'title', j.title, 'location', j.location,
        'employment_type', j.employment_type, 'department', j.department) order by j.created_at desc)
      from oa_jobs j where j.organization_id = cp.organization_id and j.status = 'published'), '[]'::jsonb));
end $$;

create or replace function public.oa_public_job(p_job uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare j public.oa_jobs; org_name text;
begin
  select * into j from oa_jobs where id = p_job and status = 'published';
  if not found then return null; end if;
  select name into org_name from oa_organizations where id = j.organization_id;
  return jsonb_build_object('company', org_name, 'id', j.id, 'title', j.title, 'location', j.location,
    'employment_type', j.employment_type, 'description', j.description, 'requirements', j.requirements,
    'qualifications', j.qualifications,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'question', q.question, 'required', q.required)
        order by q.position, q.created_at) from oa_screening_questions q where q.job_id = j.id), '[]'::jsonb));
end $$;

create or replace function public.oa_submit_application(p_job uuid, p_name text, p_email text,
  p_phone text, p_experience text, p_answers jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare j public.oa_jobs; cid uuid; a jsonb;
begin
  select * into j from oa_jobs where id = p_job and status = 'published';
  if not found then raise exception 'This job is not accepting applications.'; end if;
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 120 then raise exception 'Enter your full name.'; end if;
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 200 then raise exception 'Enter a valid email address.'; end if;
  if length(coalesce(p_experience,'')) > 4000 or length(coalesce(p_phone,'')) > 40 then raise exception 'Some answers are too long.'; end if;
  if exists (select 1 from oa_candidates where job_id = p_job and lower(email) = lower(p_email)) then
    raise exception 'You have already applied for this job.';
  end if;
  insert into oa_candidates (organization_id, job_id, full_name, email, phone, experience, source)
    values (j.organization_id, p_job, trim(p_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone,'')),''),
            nullif(trim(coalesce(p_experience,'')),''), 'conversational_apply') returning id into cid;
  for a in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    insert into oa_screening_responses (organization_id, candidate_id, question_id, answer)
      select j.organization_id, cid, q.id, left(coalesce(a->>'answer',''), 2000)
      from oa_screening_questions q where q.id = (a->>'question_id')::uuid and q.job_id = p_job
      on conflict do nothing;
  end loop;
  insert into oa_candidate_events (organization_id, candidate_id, type, detail)
    values (j.organization_id, cid, 'applied', 'Applied through the conversational application');
  return cid;
end $$;

create or replace function public.oa_accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare inv public.oa_invitations; uemail text; ws uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select email into uemail from auth.users where id = auth.uid();
  select * into inv from oa_invitations where token = p_token and status = 'pending';
  if not found then raise exception 'This invitation is invalid or has already been used.'; end if;
  if lower(inv.email) <> lower(uemail) then
    raise exception 'This invitation was sent to a different email address.';
  end if;
  insert into oa_organization_members (organization_id, user_id, role) values (inv.organization_id, auth.uid(), inv.role)
    on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active';
  select id into ws from oa_workspaces where organization_id = inv.organization_id and is_default;
  if ws is not null then
    insert into oa_workspace_members (workspace_id, user_id, role) values (ws, auth.uid(), 'member')
      on conflict do nothing;
  end if;
  update oa_invitations set status = 'accepted' where id = inv.id;
  return inv.organization_id;
end $$;

revoke all on function public.oa_public_career_page(text), public.oa_public_job(uuid),
  public.oa_submit_application(uuid,text,text,text,text,jsonb), public.oa_accept_invitation(text) from public;
grant execute on function public.oa_public_career_page(text), public.oa_public_job(uuid),
  public.oa_submit_application(uuid,text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.oa_accept_invitation(text) to authenticated;

-- Private document storage: files live under <organization_id>/..., never public.
insert into storage.buckets (id, name, public) values ('oa-documents', 'oa-documents', false)
  on conflict (id) do nothing;
create policy oa_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'oa-documents' and public.oa_is_org_member(((storage.foldername(name))[1])::uuid));
create policy oa_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'oa-documents' and public.oa_can_write(((storage.foldername(name))[1])::uuid));
create policy oa_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'oa-documents' and public.oa_can_write(((storage.foldername(name))[1])::uuid));
