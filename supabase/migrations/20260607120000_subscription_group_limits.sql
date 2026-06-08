-- Limites groupes par formule (Supporter / Ultra / Ambassadeur) — enforcement serveur.
-- Les triggers bloquent les INSERT qui dépassent le plafond (non contournable via API).

create or replace function public.talkfoot_effective_tier_for_user(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.id is null then 'freemium'
    when nullif(trim(p.app_state -> 'subscription' ->> 'activeUntil'), '') is not null
      and (p.app_state -> 'subscription' ->> 'activeUntil')::timestamptz < now()
      then 'freemium'
    when p.app_state -> 'subscription' ->> 'tier' in ('supporter_plus', 'ambassador')
      then p.app_state -> 'subscription' ->> 'tier'
    else 'freemium'
  end
  from public.profiles p
  where p.id = p_user_id;
$$;

create or replace function public.talkfoot_max_groups_joined(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
    when 'freemium' then 5
    else null
  end;
$$;

create or replace function public.talkfoot_max_groups_created(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
    when 'freemium' then 2
    when 'supporter_plus' then 10
    else null
  end;
$$;

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

create or replace function public.talkfoot_enforce_group_create_limit()
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
  v_tier := public.talkfoot_effective_tier_for_user(new.owner_id);
  v_limit := public.talkfoot_max_groups_created(v_tier);

  if v_limit is null then
    return new;
  end if;

  select count(*)::int into v_count
  from public.supporter_groups g
  where g.owner_id = new.owner_id;

  if v_count >= v_limit then
    raise exception 'subscription_create_limit'
      using errcode = 'P0001',
            hint = 'max_groups_created';
  end if;

  return new;
end;
$$;

drop trigger if exists talkfoot_group_join_limit on public.supporter_group_members;
create trigger talkfoot_group_join_limit
  before insert on public.supporter_group_members
  for each row execute function public.talkfoot_enforce_group_join_limit();

drop trigger if exists talkfoot_group_create_limit on public.supporter_groups;
create trigger talkfoot_group_create_limit
  before insert on public.supporter_groups
  for each row execute function public.talkfoot_enforce_group_create_limit();

comment on function public.talkfoot_effective_tier_for_user is
  'Formule effective depuis profiles.app_state.subscription (expiration activeUntil).';
comment on function public.talkfoot_enforce_group_join_limit is
  'Supporter: 5 tribunes max au total (créées + rejointes). Ultra/Ambassadeur: illimité.';
comment on function public.talkfoot_enforce_group_create_limit is
  'Supporter: 2 créés max. Ultra: 10. Ambassadeur: illimité.';
