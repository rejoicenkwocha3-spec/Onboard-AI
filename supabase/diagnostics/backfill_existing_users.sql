-- OPTIONAL. Run after 0001 only if users already existed in this project.
-- Gives each user without a profile the same profile, organization and workspace a new signup gets.
do $$
declare u record; v_org uuid; v_ws uuid; v_name text;
begin
  for u in select * from auth.users where id not in (select id from public.profiles) loop
    v_name := coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1));
    insert into public.profiles (id, full_name, email) values (u.id, v_name, coalesce(u.email, ''));
    insert into public.organizations (name, slug, created_by)
      values (v_name || '''s Organization',
        lower(regexp_replace(split_part(coalesce(u.email,'org'), '@', 1), '[^a-zA-Z0-9]+', '-', 'g'))
        || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), u.id) returning id into v_org;
    insert into public.organization_members (organization_id, user_id, role) values (v_org, u.id, 'owner');
    insert into public.workspaces (organization_id, name, is_default) values (v_org, 'Default Workspace', true) returning id into v_ws;
    insert into public.workspace_members (workspace_id, user_id, role) values (v_ws, u.id, 'admin');
  end loop;
end $$;
