-- Amis (demandes + acceptées) + lecture des profils entre amis acceptés.
-- Les MP p2p utilisent déjà private_messages.thread_key = p2p:<uuid_min>:<uuid_max>.

create table if not exists public.friendships (
  user_low uuid not null references auth.users (id) on delete cascade,
  user_high uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  requested_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (user_low, user_high),
  constraint friendships_ordered check (user_low < user_high),
  constraint friendships_not_self check (user_low <> user_high)
);

create index if not exists friendships_user_low_accepted_idx
  on public.friendships (user_low)
  where status = 'accepted';

create index if not exists friendships_user_high_accepted_idx
  on public.friendships (user_high)
  where status = 'accepted';

create index if not exists friendships_pending_requested_idx
  on public.friendships (requested_by)
  where status = 'pending';

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_participant" on public.friendships;
create policy "friendships_select_participant"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "friendships_insert_request" on public.friendships;
create policy "friendships_insert_pending_only"
  on public.friendships for insert
  to authenticated
  with check (
    status = 'pending'
    and auth.uid() = requested_by
    and (auth.uid() = user_low or auth.uid() = user_high)
  );

-- Seul le destinataire (pas l’auteur de la demande) peut passer en « accepted ».
drop policy if exists "friendships_update_accept_or_cancel" on public.friendships;
create policy "friendships_update_accept"
  on public.friendships for update
  to authenticated
  using (
    status = 'pending'
    and auth.uid() <> requested_by
    and (auth.uid() = user_low or auth.uid() = user_high)
  )
  with check (
    status = 'accepted'
    and (auth.uid() = user_low or auth.uid() = user_high)
  );

-- Profils : lecture pour les amis acceptés (en plus de sa propre ligne).
drop policy if exists "profiles_select_friend" on public.profiles;
create policy "profiles_select_friend"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.user_low = auth.uid() and f.user_high = profiles.id)
          or (f.user_high = auth.uid() and f.user_low = profiles.id)
        )
    )
  );

-- Demande d’ami en attente : voir le pseudo de l’autre partie (pair impliquée).
drop policy if exists "profiles_select_pending_pair" on public.profiles;
create policy "profiles_select_pending_pair"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.friendships f
      where f.status = 'pending'
        and (
          (f.user_low = auth.uid() and f.user_high = profiles.id)
          or (f.user_high = auth.uid() and f.user_low = profiles.id)
        )
    )
  );
