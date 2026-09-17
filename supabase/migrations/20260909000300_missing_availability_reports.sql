create table if not exists public.missing_availability_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text,
  source text check (source in ('tmdb', 'anilist')),
  region text check (region is null or region ~ '^[A-Z]{2}$'),
  media_type text check (media_type in ('movie', 'tv', 'anime')),
  provider_id text,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.missing_availability_reports enable row level security;

drop policy if exists "Users can read their own availability reports" on public.missing_availability_reports;
create policy "Users can read their own availability reports"
  on public.missing_availability_reports for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own availability reports" on public.missing_availability_reports;
create policy "Users can create their own availability reports"
  on public.missing_availability_reports for insert
  with check ((select auth.uid()) = user_id);

revoke all on public.missing_availability_reports from anon;
grant select, insert on public.missing_availability_reports to authenticated;
