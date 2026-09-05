create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  ticket text not null unique,
  chat_id text not null,
  message_id bigint not null,
  input jsonb not null,
  normalized jsonb not null,
  ai_status text not null check (ai_status in ('AI_PENDING', 'SUCCESS', 'AI_UNAVAILABLE')),
  ai_provider text,
  ai_model text,
  fallback_depth integer not null default 0,
  github_status text not null check (github_status in ('PENDING', 'CREATED', 'FAILED')),
  github_issue_number integer,
  github_issue_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (chat_id, message_id)
);

create index if not exists feedback_reports_ai_pending_idx
  on public.feedback_reports (ai_status) where ai_status in ('AI_PENDING', 'AI_UNAVAILABLE');

alter table public.feedback_reports enable row level security;
