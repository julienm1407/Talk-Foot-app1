-- Salons de groupes publics : lecture / écriture pour tout compte authentifié (Clerk + Supabase),
-- sans exiger une ligne dans supporter_group_members (l’adhésion reste utile pour « Mes groupes »).

drop policy if exists "supporter_group_channel_messages_select" on public.supporter_group_channel_messages;
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

drop policy if exists "supporter_group_channel_messages_insert" on public.supporter_group_channel_messages;
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
