-- Pseudo unique : profiles + auth.users, avec exclusion du compte en cours (modal OAuth).

create or replace function public.resolve_auth_user_display_norm(p_meta jsonb)
returns text
language sql
immutable
as $$
  select public.normalize_display_name(
    coalesce(
      nullif(trim(p_meta->>'display_name'), ''),
      nullif(trim(p_meta->>'full_name'), ''),
      nullif(trim(p_meta->>'name'), ''),
      nullif(trim(p_meta->>'preferred_username'), ''),
      nullif(trim(p_meta->>'user_name'), ''),
      ''
    )
  );
$$;

create or replace function public.profile_matches_actor_key(
  p_profile_id uuid,
  p_clerk_id text,
  p_actor_key text
)
returns boolean
language sql
immutable
as $$
  select
    p_actor_key is not null
    and length(trim(p_actor_key)) > 0
    and (
      (
        p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        and p_profile_id::text = p_actor_key
      )
      or p_clerk_id = p_actor_key
    );
$$;

drop function if exists public.check_display_name_available(text);

create or replace function public.check_display_name_available(
  p_new_name text,
  p_exclude_actor_key text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_display text;
  v_norm text;
begin
  v_display := regexp_replace(trim(coalesce(p_new_name, '')), '\s+', ' ', 'g');

  if length(v_display) < 2 or length(v_display) > 24 then
    return jsonb_build_object('ok', false, 'available', false, 'error', 'invalid_length');
  end if;

  if public.talkfoot_text_contains_banned(v_display) then
    return jsonb_build_object('ok', false, 'available', false, 'error', 'banned');
  end if;

  v_norm := public.normalize_display_name(v_display);

  if v_norm = '' then
    return jsonb_build_object('ok', false, 'available', false, 'error', 'invalid_length');
  end if;

  if exists (
    select 1
    from public.profiles o
    where coalesce(
      nullif(trim(o.display_name_normalized), ''),
      public.normalize_display_name(o.display_name)
    ) = v_norm
      and not public.profile_matches_actor_key(o.id, o.clerk_id, p_exclude_actor_key)
  ) then
    return jsonb_build_object(
      'ok', true,
      'available', false,
      'error', 'taken',
      'display_name', v_display
    );
  end if;

  if exists (
    select 1
    from auth.users u
    where public.resolve_auth_user_display_norm(u.raw_user_meta_data) = v_norm
      and not (
        p_exclude_actor_key is not null
        and p_exclude_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        and u.id::text = p_exclude_actor_key
      )
  ) then
    return jsonb_build_object(
      'ok', true,
      'available', false,
      'error', 'taken',
      'display_name', v_display
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'available', true,
    'display_name', v_display
  );
end;
$$;

create or replace function public.change_display_name(p_actor_key text, p_new_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.profiles%rowtype;
  v_display text;
  v_norm text;
  v_now timestamptz := now();
  v_window timestamptz;
  v_count int;
  v_next timestamptz;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_display := regexp_replace(trim(coalesce(p_new_name, '')), '\s+', ' ', 'g');

  if length(v_display) < 2 or length(v_display) > 24 then
    return jsonb_build_object('ok', false, 'error', 'invalid_length');
  end if;

  if public.talkfoot_text_contains_banned(v_display) then
    return jsonb_build_object('ok', false, 'error', 'banned');
  end if;

  select * into v_profile
  from public.profiles p
  where (
    p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and p.id::text = p_actor_key
  ) or p.clerk_id = p_actor_key
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  v_norm := public.normalize_display_name(v_display);

  if v_norm = '' then
    return jsonb_build_object('ok', false, 'error', 'invalid_length');
  end if;

  if v_norm = coalesce(
    nullif(trim(v_profile.display_name_normalized), ''),
    public.normalize_display_name(v_profile.display_name)
  ) then
    v_count := coalesce(v_profile.display_name_change_count, 0);
    v_window := coalesce(v_profile.display_name_period_start, v_profile.created_at, v_now);
    if v_count >= 2 and v_now >= v_window + interval '14 days' then
      v_count := 0;
    end if;
    return jsonb_build_object(
      'ok', true,
      'display_name', v_profile.display_name,
      'changes_remaining', greatest(0, 2 - v_count),
      'next_allowed_at', null
    );
  end if;

  v_count := coalesce(v_profile.display_name_change_count, 0);
  v_window := coalesce(v_profile.display_name_period_start, v_profile.created_at, v_now);

  if v_count >= 2 and v_now < v_window + interval '14 days' then
    return jsonb_build_object(
      'ok', false,
      'error', 'cooldown',
      'next_allowed_at', v_window + interval '14 days',
      'changes_used', v_count
    );
  end if;

  if v_count >= 2 and v_now >= v_window + interval '14 days' then
    v_count := 0;
    v_window := v_now;
  elsif v_profile.display_name_period_start is null then
    v_window := v_now;
  end if;

  if exists (
    select 1
    from public.profiles o
    where coalesce(
      nullif(trim(o.display_name_normalized), ''),
      public.normalize_display_name(o.display_name)
    ) = v_norm
      and o.id <> v_profile.id
  ) then
    return jsonb_build_object('ok', false, 'error', 'taken');
  end if;

  if exists (
    select 1
    from auth.users u
    where public.resolve_auth_user_display_norm(u.raw_user_meta_data) = v_norm
      and u.id is distinct from v_profile.id
  ) then
    return jsonb_build_object('ok', false, 'error', 'taken');
  end if;

  update public.profiles
  set
    display_name = v_display,
    display_name_normalized = v_norm,
    display_name_change_count = v_count + 1,
    display_name_period_start = v_window,
    display_name_last_changed_at = v_now
  where id = v_profile.id;

  v_next := null;
  if v_count + 1 >= 2 then
    v_next := v_window + interval '14 days';
  end if;

  return jsonb_build_object(
    'ok', true,
    'display_name', v_display,
    'changes_remaining', greatest(0, 2 - (v_count + 1)),
    'next_allowed_at', v_next
  );
end;
$$;

revoke all on function public.check_display_name_available(text, text) from public;
grant execute on function public.check_display_name_available(text, text) to anon, authenticated;
