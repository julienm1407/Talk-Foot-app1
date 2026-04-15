-- Salons groupe (même modèle d’accès que live_match_messages : utilisateurs authentifiés)
-- + messages privés (fil Coach par utilisateur, ou fil p2p entre deux UUID).

create table if not exists public.supporter_group_channel_messages (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  channel_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists supporter_group_channel_grp_ch_created_idx
  on public.supporter_group_channel_messages (group_id, channel_id, created_at desc);

alter table public.supporter_group_channel_messages enable row level security;

drop policy if exists "supporter_group_channel_messages_select" on public.supporter_group_channel_messages;
create policy "supporter_group_channel_messages_select"
  on public.supporter_group_channel_messages for select
  to authenticated
  using (true);

drop policy if exists "supporter_group_channel_messages_insert_own" on public.supporter_group_channel_messages;
create policy "supporter_group_channel_messages_insert_own"
  on public.supporter_group_channel_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- thread_key : "coach:<uuid>" (MP assistant) ou "p2p:<uuid_min>:<uuid_max>" (texte UUID triés lexicographiquement)
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists private_messages_thread_created_idx
  on public.private_messages (thread_key, created_at desc);

alter table public.private_messages enable row level security;

drop policy if exists "private_messages_select" on public.private_messages;
create policy "private_messages_select"
  on public.private_messages for select
  to authenticated
  using (
    thread_key = 'coach:' || auth.uid()::text
    or (
      split_part(thread_key, ':', 1) = 'p2p'
      and split_part(thread_key, ':', 2)::uuid = auth.uid()
    )
    or (
      split_part(thread_key, ':', 1) = 'p2p'
      and split_part(thread_key, ':', 3)::uuid = auth.uid()
    )
  );

drop policy if exists "private_messages_insert" on public.private_messages;
create policy "private_messages_insert"
  on public.private_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      thread_key = 'coach:' || auth.uid()::text
      or (
        split_part(thread_key, ':', 1) = 'p2p'
        and (
          split_part(thread_key, ':', 2)::uuid = auth.uid()
          or split_part(thread_key, ':', 3)::uuid = auth.uid()
        )
      )
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'supporter_group_channel_messages'
  ) then
    alter publication supabase_realtime add table public.supporter_group_channel_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'private_messages'
  ) then
    alter publication supabase_realtime add table public.private_messages;
  end if;
end$$;
