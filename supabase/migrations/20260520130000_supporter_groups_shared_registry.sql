-- Setup complet groupes partagés (idempotent).
-- À exécuter dans Supabase SQL Editor si supporter_groups n'existe pas encore.
-- Crée aussi les tables messages / membres si besoin.

-- 1) Messages salon (prérequis membres)
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

-- 2) Membres des groupes
create table if not exists public.supporter_group_members (
  group_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists supporter_group_members_user_idx
  on public.supporter_group_members (user_id);

alter table public.supporter_group_members enable row level security;

-- 3) Registre des groupes (visible par tous les utilisateurs authentifiés)
create table if not exists public.supporter_groups (
  id text primary key,
  name text not null,
  emoji text not null default '⚽',
  motto text not null default '',
  location text,
  group_kind text not null default 'public' check (group_kind in ('public', 'private', 'club')),
  hashtags text[] not null default '{}',
  fan_tags jsonb,
  theme jsonb not null default '{}'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_clerk_id text,
  created_at timestamptz not null default now()
);

alter table public.supporter_groups
  add column if not exists channels jsonb not null default '[]'::jsonb;

alter table public.supporter_groups
  add column if not exists owner_clerk_id text;

create index if not exists supporter_groups_hashtags_gin_idx
  on public.supporter_groups using gin (hashtags);

create index if not exists supporter_groups_owner_idx
  on public.supporter_groups (owner_id);

create index if not exists supporter_groups_owner_clerk_idx
  on public.supporter_groups (owner_clerk_id);

alter table public.supporter_groups enable row level security;

-- 4) RLS groupes (sessions anonymes Supabase OK — utile avec Clerk)
drop policy if exists "supporter_groups_select_authenticated" on public.supporter_groups;
create policy "supporter_groups_select_authenticated"
  on public.supporter_groups for select
  to authenticated
  using (true);

drop policy if exists "supporter_groups_insert_owner" on public.supporter_groups;
create policy "supporter_groups_insert_owner"
  on public.supporter_groups for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "supporter_groups_update_owner" on public.supporter_groups;
create policy "supporter_groups_update_owner"
  on public.supporter_groups for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "supporter_groups_delete_owner" on public.supporter_groups;
create policy "supporter_groups_delete_owner"
  on public.supporter_groups for delete
  to authenticated
  using (owner_id = auth.uid());

-- 5) RLS membres
drop policy if exists "supporter_group_members_select" on public.supporter_group_members;
create policy "supporter_group_members_select"
  on public.supporter_group_members for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "supporter_group_members_insert_self" on public.supporter_group_members;
create policy "supporter_group_members_insert_self"
  on public.supporter_group_members for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "supporter_group_members_delete_self" on public.supporter_group_members;
create policy "supporter_group_members_delete_self"
  on public.supporter_group_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6) RLS messages salon
drop policy if exists "supporter_group_channel_messages_select" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_insert_own" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_insert" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_select_member" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_insert_member" on public.supporter_group_channel_messages;

create policy "supporter_group_channel_messages_select"
  on public.supporter_group_channel_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.supporter_group_members m
      where m.group_id = supporter_group_channel_messages.group_id
        and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.supporter_groups g
      where g.id = supporter_group_channel_messages.group_id
        and g.group_kind = 'public'
    )
    or (
      channel_id = 'general'
      and coalesce(metadata->>'tf_public_debate', '') = 'true'
    )
  );

create policy "supporter_group_channel_messages_insert"
  on public.supporter_group_channel_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.supporter_group_members m
        where m.group_id = supporter_group_channel_messages.group_id
          and m.user_id = auth.uid()
      )
      or exists (
        select 1 from public.supporter_groups g
        where g.id = supporter_group_channel_messages.group_id
          and g.group_kind = 'public'
      )
      or (
        channel_id = 'general'
        and coalesce(metadata->>'tf_public_debate', '') = 'true'
      )
    )
  );

-- 7) Realtime sur le registre groupes
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'supporter_groups'
  ) then
    alter publication supabase_realtime add table public.supporter_groups;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'supporter_group_channel_messages'
  ) then
    alter publication supabase_realtime add table public.supporter_group_channel_messages;
  end if;
end$$;
