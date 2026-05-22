-- Stats d’activité groupe (messages du jour, « en ligne » 30 min) — lecture publique des agrégats uniquement.

create or replace function public.get_group_activity_stats(p_group_ids text[])
returns table (
  group_id text,
  messages_today integer,
  online_now integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.group_id,
    count(*) filter (
      where m.created_at >= date_trunc('day', (now() at time zone 'utc'))
    )::integer as messages_today,
    count(distinct m.user_id) filter (
      where m.created_at >= now() - interval '30 minutes'
    )::integer as online_now
  from public.supporter_group_channel_messages m
  where
    p_group_ids is not null
    and array_length(p_group_ids, 1) > 0
    and m.group_id = any (p_group_ids)
  group by m.group_id;
$$;

revoke all on function public.get_group_activity_stats(text[]) from public;
grant execute on function public.get_group_activity_stats(text[]) to anon, authenticated;

comment on function public.get_group_activity_stats is
  'Agrégats salon : messages depuis minuit UTC + participants distincts sur 30 min.';
