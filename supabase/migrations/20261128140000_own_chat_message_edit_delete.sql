-- Modifier / supprimer ses propres messages (tchat live + tribunes).

alter table public.live_match_messages
  add column if not exists updated_at timestamptz;

update public.live_match_messages
  set updated_at = created_at
  where updated_at is null;

alter table public.live_match_messages
  alter column updated_at set default now();

alter table public.live_match_messages
  alter column updated_at set not null;

alter table public.supporter_group_channel_messages
  add column if not exists updated_at timestamptz;

update public.supporter_group_channel_messages
  set updated_at = created_at
  where updated_at is null;

alter table public.supporter_group_channel_messages
  alter column updated_at set default now();

alter table public.supporter_group_channel_messages
  alter column updated_at set not null;

create or replace function public.talkfoot_own_message_body_only()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'live_match_messages' then
    if new.user_id is distinct from old.user_id
       or new.match_id is distinct from old.match_id
       or new.metadata is distinct from old.metadata
       or new.created_at is distinct from old.created_at
       or new.display_name is distinct from old.display_name then
      raise exception 'own_message_edit_body_only' using errcode = '42501';
    end if;
  elsif tg_table_name = 'supporter_group_channel_messages' then
    if new.user_id is distinct from old.user_id
       or new.group_id is distinct from old.group_id
       or new.channel_id is distinct from old.channel_id
       or new.metadata is distinct from old.metadata
       or new.created_at is distinct from old.created_at
       or new.display_name is distinct from old.display_name then
      raise exception 'own_message_edit_body_only' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists live_match_messages_body_only on public.live_match_messages;
create trigger live_match_messages_body_only
  before update on public.live_match_messages
  for each row execute function public.talkfoot_own_message_body_only();

drop trigger if exists supporter_group_channel_messages_body_only on public.supporter_group_channel_messages;
create trigger supporter_group_channel_messages_body_only
  before update on public.supporter_group_channel_messages
  for each row execute function public.talkfoot_own_message_body_only();

drop trigger if exists live_match_messages_moderation on public.live_match_messages;
create trigger live_match_messages_moderation
  before insert or update of body, display_name on public.live_match_messages
  for each row execute function public.talkfoot_moderate_live_match_message();

drop trigger if exists supporter_group_channel_messages_moderation on public.supporter_group_channel_messages;
create trigger supporter_group_channel_messages_moderation
  before insert or update of body, display_name on public.supporter_group_channel_messages
  for each row execute function public.talkfoot_moderate_group_channel_message();

drop policy if exists "live_match_messages_update_own" on public.live_match_messages;
create policy "live_match_messages_update_own"
  on public.live_match_messages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "live_match_messages_delete_own" on public.live_match_messages;
create policy "live_match_messages_delete_own"
  on public.live_match_messages for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "supporter_group_channel_messages_update_own" on public.supporter_group_channel_messages;
create policy "supporter_group_channel_messages_update_own"
  on public.supporter_group_channel_messages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "supporter_group_channel_messages_delete_own" on public.supporter_group_channel_messages;
create policy "supporter_group_channel_messages_delete_own"
  on public.supporter_group_channel_messages for delete
  to authenticated
  using (auth.uid() = user_id);

grant update, delete on public.live_match_messages to authenticated;
grant update, delete on public.supporter_group_channel_messages to authenticated;
