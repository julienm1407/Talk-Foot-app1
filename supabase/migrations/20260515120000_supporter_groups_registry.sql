-- Registre cloud des groupes supporters (visibles par tous les utilisateurs authentifiés).

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
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists supporter_groups_hashtags_gin_idx
  on public.supporter_groups using gin (hashtags);

create index if not exists supporter_groups_owner_idx
  on public.supporter_groups (owner_id);

alter table public.supporter_groups enable row level security;

drop policy if exists "supporter_groups_select_authenticated" on public.supporter_groups;
create policy "supporter_groups_select_authenticated"
  on public.supporter_groups for select
  to authenticated
  using ((auth.jwt() ->> 'is_anonymous') is distinct from 'true');

drop policy if exists "supporter_groups_insert_owner" on public.supporter_groups;
create policy "supporter_groups_insert_owner"
  on public.supporter_groups for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and owner_id = auth.uid()
  );

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
