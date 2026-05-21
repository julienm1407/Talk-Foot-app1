-- Likes partagés sur messages des salons groupe + notifications cloche (like reçu).

create table if not exists public.supporter_group_message_likes (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  message_id uuid not null references public.supporter_group_channel_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists supporter_group_message_likes_group_idx
  on public.supporter_group_message_likes (group_id);

create index if not exists supporter_group_message_likes_message_idx
  on public.supporter_group_message_likes (message_id);

alter table public.supporter_group_message_likes enable row level security;

drop policy if exists "supporter_group_message_likes_select" on public.supporter_group_message_likes;
create policy "supporter_group_message_likes_select"
  on public.supporter_group_message_likes for select
  to authenticated
  using (true);

drop policy if exists "supporter_group_message_likes_insert_own" on public.supporter_group_message_likes;
create policy "supporter_group_message_likes_insert_own"
  on public.supporter_group_message_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "supporter_group_message_likes_delete_own" on public.supporter_group_message_likes;
create policy "supporter_group_message_likes_delete_own"
  on public.supporter_group_message_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.inbox_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_supabase_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'message_like' check (kind in ('message_like')),
  title text not null,
  body text not null,
  href text not null,
  actor_display_name text,
  group_id text,
  message_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inbox_notifications_recipient_idx
  on public.inbox_notifications (recipient_supabase_id, created_at desc);

alter table public.inbox_notifications enable row level security;

drop policy if exists "inbox_notifications_select_own" on public.inbox_notifications;
create policy "inbox_notifications_select_own"
  on public.inbox_notifications for select
  to authenticated
  using (recipient_supabase_id = auth.uid());

drop policy if exists "inbox_notifications_insert_authenticated" on public.inbox_notifications;
create policy "inbox_notifications_insert_authenticated"
  on public.inbox_notifications for insert
  to authenticated
  with check (recipient_supabase_id is not null);

drop policy if exists "inbox_notifications_update_own" on public.inbox_notifications;
create policy "inbox_notifications_update_own"
  on public.inbox_notifications for update
  to authenticated
  using (recipient_supabase_id = auth.uid())
  with check (recipient_supabase_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'supporter_group_message_likes'
  ) then
    alter publication supabase_realtime add table public.supporter_group_message_likes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inbox_notifications'
  ) then
    alter publication supabase_realtime add table public.inbox_notifications;
  end if;
end$$;
