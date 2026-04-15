-- Membres des salons (style Discord) : seuls les membres voient / écrivent dans supporter_group_channel_messages.

create table if not exists public.supporter_group_members (
  group_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists supporter_group_members_user_idx
  on public.supporter_group_members (user_id);

alter table public.supporter_group_members enable row level security;

drop policy if exists "supporter_group_members_select" on public.supporter_group_members;
create policy "supporter_group_members_select"
  on public.supporter_group_members for select
  to authenticated
  using (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and exists (
      select 1 from public.supporter_group_members m
      where m.group_id = supporter_group_members.group_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "supporter_group_members_insert_self" on public.supporter_group_members;
create policy "supporter_group_members_insert_self"
  on public.supporter_group_members for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );

drop policy if exists "supporter_group_members_delete_self" on public.supporter_group_members;
create policy "supporter_group_members_delete_self"
  on public.supporter_group_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );

-- Messages salon : uniquement membres du groupe (plus « tout le monde authentifié »).

drop policy if exists "supporter_group_channel_messages_select" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_insert_own" on public.supporter_group_channel_messages;

create policy "supporter_group_channel_messages_select_member"
  on public.supporter_group_channel_messages for select
  to authenticated
  using (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and exists (
      select 1 from public.supporter_group_members m
      where m.group_id = supporter_group_channel_messages.group_id
        and m.user_id = auth.uid()
    )
  );

create policy "supporter_group_channel_messages_insert_member"
  on public.supporter_group_channel_messages for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and auth.uid() = user_id
    and exists (
      select 1 from public.supporter_group_members m
      where m.group_id = supporter_group_channel_messages.group_id
        and m.user_id = auth.uid()
    )
  );
