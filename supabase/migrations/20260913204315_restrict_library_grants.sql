-- RLS controls rows, but not TRUNCATE/TRIGGER privileges. Narrow Data API roles.
revoke all on public.user_library_snapshots from anon, authenticated;
grant select, insert, update, delete on public.user_library_snapshots to authenticated;
alter function public.set_user_library_updated_at() set search_path = public, pg_temp;
