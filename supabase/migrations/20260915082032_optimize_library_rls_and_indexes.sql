-- Keep auth.uid() as an init-plan and index the ownership foreign key.
drop policy if exists "Users can read their own library" on public.user_library_snapshots;
create policy "Users can read their own library"
  on public.user_library_snapshots for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own library" on public.user_library_snapshots;
create policy "Users can insert their own library"
  on public.user_library_snapshots for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own library" on public.user_library_snapshots;
create policy "Users can update their own library"
  on public.user_library_snapshots for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own library" on public.user_library_snapshots;
create policy "Users can delete their own library"
  on public.user_library_snapshots for delete
  using ((select auth.uid()) = user_id);

create index if not exists missing_availability_reports_user_id_idx
  on public.missing_availability_reports (user_id);
