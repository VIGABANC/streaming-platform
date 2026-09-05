-- The feedback webhook uses the Supabase Data API with the server-only service role.
-- Keep public and authenticated clients out of this table; RLS is defense in depth.
revoke all on table public.feedback_reports from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.feedback_reports to service_role;
