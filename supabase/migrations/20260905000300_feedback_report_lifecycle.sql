alter table public.feedback_reports
  add column if not exists public_status text not null default 'STORED' check (public_status in ('STORED', 'IN_REVIEW', 'NEED_INFO', 'RESOLVED', 'CLOSED')),
  add column if not exists assignee text,
  add column if not exists admin_message_id bigint;
