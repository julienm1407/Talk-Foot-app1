-- Comptes admin (admin_users) : pas de plafond tribunes créées / rejointes côté serveur.

create or replace function public.talkfoot_is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.admin_users au on lower(au.email) = lower(p.email)
    where p.id = p_user_id
  );
$$;

revoke all on function public.talkfoot_is_admin_user(uuid) from public;
grant execute on function public.talkfoot_is_admin_user(uuid) to authenticated;

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
  if public.talkfoot_is_admin_user(new.user_id) then
    return new;
  end if;

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
  if public.talkfoot_is_admin_user(new.owner_id) then
    return new;
  end if;

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

comment on function public.talkfoot_is_admin_user is
  'True si le profil Supabase est listé dans admin_users (email).';
comment on function public.talkfoot_enforce_group_join_limit is
  'Supporter: 5 tribunes max. Ultra/Ambassadeur: illimité. Admin: illimité.';
comment on function public.talkfoot_enforce_group_create_limit is
  'Supporter: 2 créés max. Ultra: 10. Ambassadeur/admin: illimité.';
