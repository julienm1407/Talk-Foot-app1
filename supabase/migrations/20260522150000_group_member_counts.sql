-- Comptage public des adhérents par groupe (agrégat uniquement, pas la liste des users).

create or replace function public.get_group_member_counts(p_group_ids text[])
returns table (
  group_id text,
  member_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.group_id,
    count(*)::integer as member_count
  from public.supporter_group_members m
  where
    p_group_ids is not null
    and array_length(p_group_ids, 1) > 0
    and m.group_id = any (p_group_ids)
  group by m.group_id;
$$;

revoke all on function public.get_group_member_counts(text[]) from public;
grant execute on function public.get_group_member_counts(text[]) to anon, authenticated;

comment on function public.get_group_member_counts is
  'Nombre d’adhérents par groupe (lecture agrégée, sans exposer les user_id).';
