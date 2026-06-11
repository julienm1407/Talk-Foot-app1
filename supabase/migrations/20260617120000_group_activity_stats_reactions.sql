-- Ambiance tribune : messages du jour (Paris), réactions et présence 30 min.
-- DROP requis : le type de retour change (ajout reactions_today).

drop function if exists public.get_group_activity_stats(text[]);

create function public.get_group_activity_stats(p_group_ids text[])
returns table (
  group_id text,
  messages_today integer,
  reactions_today integer,
  online_now integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ids as (
    select unnest(p_group_ids) as group_id
  ),
  day_start as (
    select (date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris') as ts
  )
  select 
    i.group_id,
    coalesce((
      select count(*)::integer
      from public.supporter_group_channel_messages m, day_start d
      where m.group_id = i.group_id
        and m.created_at >= d.ts
    ), 0) as messages_today,
    coalesce((
      select count(*)::integer
      from public.supporter_group_message_likes l, day_start d
      where l.group_id = i.group_id
        and l.created_at >= d.ts
    ), 0) as reactions_today,
    coalesce((
      select count(distinct m.user_id)::integer
      from public.supporter_group_channel_messages m
      where m.group_id = i.group_id
        and m.created_at >= now() - interval '30 minutes'
    ), 0) as online_now
  from ids i
  where p_group_ids is not null
    and array_length(p_group_ids, 1) > 0;
$$;

revoke all on function public.get_group_activity_stats(text[]) from public;
grant execute on function public.get_group_activity_stats(text[]) to anon, authenticated;

comment on function public.get_group_activity_stats is
  'Agrégats tribune : messages depuis minuit Paris, réactions du jour, auteurs distincts sur 30 min.';
