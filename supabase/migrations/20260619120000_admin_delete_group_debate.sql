-- Suppression admin : tribunes et débats (Talk Foot admin uniquement).

create table if not exists public.admin_removed_groups (
  group_id text primary key,
  removed_at timestamptz not null default now(),
  removed_by uuid references auth.users (id) on delete set null
);

create table if not exists public.admin_removed_debates (
  debate_id text primary key,
  removed_at timestamptz not null default now(),
  removed_by uuid references auth.users (id) on delete set null
);

alter table public.admin_removed_groups enable row level security;
alter table public.admin_removed_debates enable row level security;

drop policy if exists "admin_removed_groups_select" on public.admin_removed_groups;
create policy "admin_removed_groups_select"
  on public.admin_removed_groups for select
  to authenticated, anon
  using (true);

drop policy if exists "admin_removed_debates_select" on public.admin_removed_debates;
create policy "admin_removed_debates_select"
  on public.admin_removed_debates for select
  to authenticated, anon
  using (true);

create or replace function public.admin_delete_group(p_group_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id text := nullif(trim(p_group_id), '');
  v_deleted_messages int := 0;
  v_deleted_members int := 0;
begin
  if not public.talkfoot_is_admin_actor() then
    return jsonb_build_object('ok', false, 'error', 'admin_only');
  end if;
  if v_group_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_group_id');
  end if;

  delete from public.group_featured_debate where group_id = v_group_id;

  delete from public.match_tifo_pixels where group_id = v_group_id;
  delete from public.match_tifo_pixel_usage where group_id = v_group_id;

  delete from public.inbox_notifications n
  where n.group_id = v_group_id
     or n.message_id in (
       select m.id
       from public.supporter_group_channel_messages m
       where m.group_id = v_group_id
     );

  delete from public.supporter_group_channel_messages m
  where m.group_id = v_group_id;
  get diagnostics v_deleted_messages = row_count;

  delete from public.supporter_group_members m
  where m.group_id = v_group_id;
  get diagnostics v_deleted_members = row_count;

  delete from public.supporter_groups where id = v_group_id;

  update public.debates
  set group_id = null,
      updated_at = now()
  where group_id = v_group_id;

  insert into public.admin_removed_groups (group_id, removed_by)
  values (v_group_id, auth.uid())
  on conflict (group_id) do update
    set removed_at = now(),
        removed_by = excluded.removed_by;

  return jsonb_build_object(
    'ok', true,
    'group_id', v_group_id,
    'deleted_messages', v_deleted_messages,
    'deleted_members', v_deleted_members
  );
end;
$$;

create or replace function public.admin_delete_debate(p_debate_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debate_id text := nullif(trim(p_debate_id), '');
  v_deleted_messages int := 0;
begin
  if not public.talkfoot_is_admin_actor() then
    return jsonb_build_object('ok', false, 'error', 'admin_only');
  end if;
  if v_debate_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_debate_id');
  end if;

  delete from public.group_featured_debate where debate_id = v_debate_id;

  delete from public.inbox_notifications n
  where n.message_id in (
    select m.id
    from public.supporter_group_channel_messages m
    where m.channel_id = 'general'
      and nullif(trim(m.metadata->>'debate_id'), '') = v_debate_id
  );

  delete from public.supporter_group_channel_messages m
  where m.channel_id = 'general'
    and nullif(trim(m.metadata->>'debate_id'), '') = v_debate_id;
  get diagnostics v_deleted_messages = row_count;

  delete from public.debates where id = v_debate_id;

  insert into public.admin_removed_debates (debate_id, removed_by)
  values (v_debate_id, auth.uid())
  on conflict (debate_id) do update
    set removed_at = now(),
        removed_by = excluded.removed_by;

  return jsonb_build_object(
    'ok', true,
    'debate_id', v_debate_id,
    'deleted_messages', v_deleted_messages
  );
end;
$$;

revoke all on function public.admin_delete_group(text) from public;
grant execute on function public.admin_delete_group(text) to authenticated;

revoke all on function public.admin_delete_debate(text) from public;
grant execute on function public.admin_delete_debate(text) to authenticated;

comment on function public.admin_delete_group is
  'Supprime une tribune (données cloud + masquage catalogue) — admin Talk Foot uniquement.';

comment on function public.admin_delete_debate is
  'Supprime un débat et son fil associé — admin Talk Foot uniquement.';
