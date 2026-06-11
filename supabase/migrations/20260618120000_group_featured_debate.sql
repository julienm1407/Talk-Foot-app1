-- Débat mis en avant sur une tribune (salon général) — liaison admin uniquement.

create table if not exists public.group_featured_debate (
  group_id text primary key,
  debate_id text not null references public.debates (id) on delete cascade,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists group_featured_debate_debate_idx
  on public.group_featured_debate (debate_id);

alter table public.group_featured_debate enable row level security;

drop policy if exists "group_featured_debate_select" on public.group_featured_debate;
create policy "group_featured_debate_select"
  on public.group_featured_debate for select
  to authenticated, anon
  using (true);

create or replace function public.admin_set_group_featured_debate(
  p_group_id text,
  p_debate_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id text := nullif(trim(p_group_id), '');
  v_debate_id text := nullif(trim(p_debate_id), '');
begin
  if not public.talkfoot_is_admin_actor() then
    return jsonb_build_object('ok', false, 'error', 'admin_only');
  end if;
  if v_group_id is null or v_debate_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_params');
  end if;
  if not exists (select 1 from public.debates d where d.id = v_debate_id and d.status = 'published') then
    return jsonb_build_object('ok', false, 'error', 'debate_not_found');
  end if;

  insert into public.group_featured_debate (group_id, debate_id, updated_by)
  values (v_group_id, v_debate_id, auth.uid())
  on conflict (group_id) do update
    set debate_id = excluded.debate_id,
        updated_at = now(),
        updated_by = excluded.updated_by;

  return jsonb_build_object('ok', true, 'group_id', v_group_id, 'debate_id', v_debate_id);
end;
$$;

create or replace function public.admin_clear_group_featured_debate(p_group_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id text := nullif(trim(p_group_id), '');
begin
  if not public.talkfoot_is_admin_actor() then
    return jsonb_build_object('ok', false, 'error', 'admin_only');
  end if;
  if v_group_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_group_id');
  end if;

  delete from public.group_featured_debate where group_id = v_group_id;
  return jsonb_build_object('ok', true, 'group_id', v_group_id);
end;
$$;

revoke all on function public.admin_set_group_featured_debate(text, text) from public;
grant execute on function public.admin_set_group_featured_debate(text, text) to authenticated;

revoke all on function public.admin_clear_group_featured_debate(text) from public;
grant execute on function public.admin_clear_group_featured_debate(text) to authenticated;

comment on table public.group_featured_debate is
  'Débat affiché sur le salon général d''une tribune — éditable par admin Talk Foot uniquement.';
