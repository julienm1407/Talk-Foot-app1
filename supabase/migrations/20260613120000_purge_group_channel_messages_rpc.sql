-- Purge des messages de tribune (salons groupe) — propriétaire de tribune ou admin Talk Foot.
-- Les likes sont supprimés en cascade (FK supporter_group_message_likes.message_id).

create or replace function public.talkfoot_is_admin_actor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.talkfoot_is_admin_actor() from public;
grant execute on function public.talkfoot_is_admin_actor() to authenticated;

create or replace function public.talkfoot_purge_group_channel_messages(p_group_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id text := nullif(trim(p_group_id), '');
  v_owner uuid;
  v_deleted_messages int := 0;
  v_deleted_inbox int := 0;
begin
  if v_group_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_group_id');
  end if;

  if not public.talkfoot_is_admin_actor() then
    select g.owner_id into v_owner
    from public.supporter_groups g
    where g.id = v_group_id;

    if v_owner is null then
      return jsonb_build_object('ok', false, 'error', 'group_not_found');
    end if;

    if v_owner is distinct from auth.uid() then
      return jsonb_build_object('ok', false, 'error', 'not_owner');
    end if;
  end if;

  delete from public.inbox_notifications n
  where n.group_id = v_group_id
     or n.message_id in (
       select m.id
       from public.supporter_group_channel_messages m
       where m.group_id = v_group_id
     );
  get diagnostics v_deleted_inbox = row_count;

  delete from public.supporter_group_channel_messages m
  where m.group_id = v_group_id;
  get diagnostics v_deleted_messages = row_count;

  return jsonb_build_object(
    'ok', true,
    'group_id', v_group_id,
    'deleted_messages', v_deleted_messages,
    'deleted_inbox', v_deleted_inbox
  );
end;
$$;

revoke all on function public.talkfoot_purge_group_channel_messages(text) from public;
grant execute on function public.talkfoot_purge_group_channel_messages(text) to authenticated;
grant execute on function public.talkfoot_purge_group_channel_messages(text) to service_role;

comment on function public.talkfoot_purge_group_channel_messages is
  'Supprime tous les messages d''une tribune (group_id). Admin ou propriétaire de la tribune uniquement.';
