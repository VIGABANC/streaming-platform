create table if not exists public.user_library_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null default 1 check (version = 1),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_library_snapshots enable row level security;

drop policy if exists "Users can read their own library" on public.user_library_snapshots;
create policy "Users can read their own library"
  on public.user_library_snapshots for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own library" on public.user_library_snapshots;
create policy "Users can insert their own library"
  on public.user_library_snapshots for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own library" on public.user_library_snapshots;
create policy "Users can update their own library"
  on public.user_library_snapshots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own library" on public.user_library_snapshots;
create policy "Users can delete their own library"
  on public.user_library_snapshots for delete
  using (auth.uid() = user_id);

create or replace function public.set_user_library_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_library_updated_at on public.user_library_snapshots;
create trigger set_user_library_updated_at
  before update on public.user_library_snapshots
  for each row execute function public.set_user_library_updated_at();
