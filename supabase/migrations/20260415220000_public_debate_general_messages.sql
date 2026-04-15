-- Débat « général » ouvert à tous : lecture / écriture sans être dans supporter_group_members,
-- uniquement pour les lignes dont metadata.tf_public_debate = 'true' (posé par l’app sur ce mode).

drop policy if exists "supporter_group_channel_messages_select" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_insert_own" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_select_member" on public.supporter_group_channel_messages;
drop policy if exists "supporter_group_channel_messages_insert_member" on public.supporter_group_channel_messages;

create policy "supporter_group_channel_messages_select"
  on public.supporter_group_channel_messages for select
  to authenticated
  using (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and (
      exists (
        select 1 from public.supporter_group_members m
        where m.group_id = supporter_group_channel_messages.group_id
          and m.user_id = auth.uid()
      )
      or (
        channel_id = 'general'
        and coalesce(metadata->>'tf_public_debate', '') = 'true'
      )
    )
  );

create policy "supporter_group_channel_messages_insert"
  on public.supporter_group_channel_messages for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and auth.uid() = user_id
    and (
      exists (
        select 1 from public.supporter_group_members m
        where m.group_id = supporter_group_channel_messages.group_id
          and m.user_id = auth.uid()
      )
      or (
        channel_id = 'general'
        and coalesce(metadata->>'tf_public_debate', '') = 'true'
      )
    )
  );
