-- Signalements d'utilisateurs (UGC / Play Store).
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id text not null,
  reported_user_id text not null,
  reported_display_name text,
  reason text not null check (char_length(trim(reason)) >= 2),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint user_reports_not_self check (reporter_id <> reported_user_id)
);

create index if not exists user_reports_reported_idx on public.user_reports (reported_user_id, created_at desc);
create index if not exists user_reports_status_idx on public.user_reports (status, created_at desc);
-- AT TIME ZONE 'UTC' = expression IMMUTABLE (contrairement à created_at::date).
create unique index if not exists user_reports_dedupe_day_idx
  on public.user_reports (reporter_id, reported_user_id, reason, ((created_at AT TIME ZONE 'UTC')::date));

alter table public.user_reports enable row level security;

drop policy if exists "user_reports_authenticated_insert" on public.user_reports;
create policy "user_reports_authenticated_insert"
  on public.user_reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()::text
    and auth.uid() is not null
  );

drop policy if exists "user_reports_admin_read" on public.user_reports;
create policy "user_reports_admin_read"
  on public.user_reports for select
  to authenticated
  using (public.talkfoot_is_admin_actor());

drop policy if exists "user_reports_admin_update" on public.user_reports;
create policy "user_reports_admin_update"
  on public.user_reports for update
  to authenticated
  using (public.talkfoot_is_admin_actor())
  with check (public.talkfoot_is_admin_actor());

grant select, insert, update on public.user_reports to authenticated;
