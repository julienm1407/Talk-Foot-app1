-- Likes sur messages du chat live (compteur partagé + temps réel)

create table if not exists public.live_match_message_likes (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  message_id uuid not null references public.live_match_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists live_match_message_likes_match_idx
  on public.live_match_message_likes (match_id);

create index if not exists live_match_message_likes_message_idx
  on public.live_match_message_likes (message_id);

alter table public.live_match_message_likes enable row level security;

drop policy if exists "live_match_message_likes_select" on public.live_match_message_likes;
create policy "live_match_message_likes_select"
  on public.live_match_message_likes for select
  to authenticated
  using (true);

drop policy if exists "live_match_message_likes_insert_own" on public.live_match_message_likes;
create policy "live_match_message_likes_insert_own"
  on public.live_match_message_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "live_match_message_likes_delete_own" on public.live_match_message_likes;
create policy "live_match_message_likes_delete_own"
  on public.live_match_message_likes for delete
  to authenticated
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_match_message_likes'
  ) then
    alter publication supabase_realtime add table public.live_match_message_likes;
  end if;
end$$;
