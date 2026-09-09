create table if not exists public.telegram_feedback_sessions (
  bot text not null check (bot = 'feedback'),
  chat_id text not null,
  user_id text not null,
  step text not null check (step in ('type', 'description', 'context', 'review')),
  draft jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (bot, chat_id, user_id)
);

alter table public.telegram_feedback_sessions enable row level security;
revoke all on table public.telegram_feedback_sessions from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.telegram_feedback_sessions to service_role;
