-- Visages « en ligne » par groupe : derniers auteurs actifs (30 min), sans exposer d’autres données.

create or replace function public.get_group_active_presence(
  p_group_ids text[],
  p_limit_per_group integer default 4
)
returns table (
  group_id text,
  user_id text,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_per_user as (
    select distinct on (m.group_id, m.user_id)
      m.group_id,
      m.user_id::text as user_id,
      coalesce(nullif(trim(m.display_name), ''), 'Supporter') as display_name,
      m.created_at
    from public.supporter_group_channel_messages m
    where
      p_group_ids is not null
      and array_length(p_group_ids, 1) > 0
      and m.group_id = any (p_group_ids)
      and m.created_at >= now() - interval '30 minutes'
    order by m.group_id, m.user_id, m.created_at desc
  ),
  ranked as (
    select
      group_id,
      user_id,
      display_name,
      row_number() over (partition by group_id order by created_at desc) as rn
    from latest_per_user
  )
  select group_id, user_id, display_name
  from ranked
  where rn <= greatest(1, least(coalesce(p_limit_per_group, 4), 8));
$$;

revoke all on function public.get_group_active_presence(text[], integer) from public;
grant execute on function public.get_group_active_presence(text[], integer) to anon, authenticated;

comment on function public.get_group_active_presence is
  'Jusqu’à N supporters distincts actifs sur 30 min par groupe (display_name pour facepile).';
