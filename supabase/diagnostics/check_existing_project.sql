-- Read only. Run in the Supabase SQL editor of the reused project and share the results.
select 'tables' as what, table_name as name from information_schema.tables
  where table_schema = 'public' order by 2;
select 'triggers on auth.users' as what, tgname as name from pg_trigger
  where tgrelid = 'auth.users'::regclass and not tgisinternal;
select 'existing users' as what, count(*)::text as name from auth.users;
select 'public functions' as what, proname as name from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 2;
