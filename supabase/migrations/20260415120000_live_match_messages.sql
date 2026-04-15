-- Talk Foot — chat live partagé par match (temps réel via Supabase Realtime)
-- Après push : Authentication → Providers → activer « Anonymous sign-ins »
--   pour que les visiteurs sans compte puissent quand même poster (JWT anon).

create table if not exists public.live_match_messages (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists live_match_messages_match_created_idx
  on public.live_match_messages (match_id, created_at desc);

alter table public.live_match_messages enable row level security;

drop policy if exists "live_match_messages_select_authenticated" on public.live_match_messages;
create policy "live_match_messages_select_authenticated"
  on public.live_match_messages for select
  to authenticated
  using (true);

drop policy if exists "live_match_messages_insert_own" on public.live_match_messages;
create policy "live_match_messages_insert_own"
  on public.live_match_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_match_messages'
  ) then
    alter publication supabase_realtime add table public.live_match_messages;
  end if;
end$$;
