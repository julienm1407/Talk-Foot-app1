-- Plafond Supporter : 5 tribunes au total (adhésions, créées incluses).
-- Annule la version intermédiaire qui excluait les tribunes créées du décompte.

create or replace function public.talkfoot_enforce_group_join_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_limit int;
  v_count int;
begin
  if exists (
    select 1
    from public.supporter_group_members m
    where m.group_id = new.group_id and m.user_id = new.user_id
  ) then
    return new;
  end if;

  v_tier := public.talkfoot_effective_tier_for_user(new.user_id);
  v_limit := public.talkfoot_max_groups_joined(v_tier);

  if v_limit is null then
    return new;
  end if;

  select count(*)::int into v_count
  from public.supporter_group_members m
  where m.user_id = new.user_id;

  if v_count >= v_limit then
    raise exception 'subscription_join_limit'
      using errcode = 'P0001',
            hint = 'max_groups_joined';
  end if;

  return new;
end;
$$;

comment on function public.talkfoot_enforce_group_join_limit is
  'Supporter: 5 tribunes max au total (créées + rejointes). Ultra/Ambassadeur: illimité.';
