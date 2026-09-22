-- Jetons FCM + matchs à rappeler (clubs favoris, coup d’envoi).

create table if not exists public.push_device_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null default 'android',
  updated_at timestamptz not null default now()
);

create index if not exists push_device_tokens_user_id_idx
  on public.push_device_tokens (user_id);

create table if not exists public.match_kickoff_watches (
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  kickoff_at timestamptz not null,
  title text not null,
  body text not null,
  href text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists match_kickoff_watches_kickoff_idx
  on public.match_kickoff_watches (kickoff_at);

create table if not exists public.match_kickoff_push_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  kind text not null default 't15',
  sent_at timestamptz not null default now(),
  primary key (user_id, match_id, kind)
);

alter table public.push_device_tokens enable row level security;
alter table public.match_kickoff_watches enable row level security;
alter table public.match_kickoff_push_log enable row level security;

drop policy if exists "push_tokens_own_select" on public.push_device_tokens;
create policy "push_tokens_own_select"
  on public.push_device_tokens for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "push_tokens_own_write" on public.push_device_tokens;
create policy "push_tokens_own_write"
  on public.push_device_tokens for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens_own_update" on public.push_device_tokens;
create policy "push_tokens_own_update"
  on public.push_device_tokens for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "push_tokens_own_delete" on public.push_device_tokens;
create policy "push_tokens_own_delete"
  on public.push_device_tokens for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "kickoff_watches_own_select" on public.match_kickoff_watches;
create policy "kickoff_watches_own_select"
  on public.match_kickoff_watches for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "kickoff_watches_own_write" on public.match_kickoff_watches;
create policy "kickoff_watches_own_write"
  on public.match_kickoff_watches for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "kickoff_watches_own_update" on public.match_kickoff_watches;
create policy "kickoff_watches_own_update"
  on public.match_kickoff_watches for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kickoff_watches_own_delete" on public.match_kickoff_watches;
create policy "kickoff_watches_own_delete"
  on public.match_kickoff_watches for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.push_device_tokens to authenticated;
grant select, insert, update, delete on public.match_kickoff_watches to authenticated;
grant all on public.push_device_tokens to service_role;
grant all on public.match_kickoff_watches to service_role;
grant all on public.match_kickoff_push_log to service_role;
