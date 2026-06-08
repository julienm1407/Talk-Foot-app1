-- Vérification pseudo disponible à l'inscription (anon) + création profil avec unicité.

create or replace function public.check_display_name_available(p_new_name text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
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

create or replace function public.ensure_talkfoot_profile(
  p_actor_key text,
  p_display_name text default 'Supporter',
  p_oauth_profile_completed boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_is_uuid boolean;
  v_name text;
  v_norm text;
  v_oauth_done boolean;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is not null then
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'id', v_profile.id,
      'display_name', v_profile.display_name,
      'onboarding_complete', v_profile.onboarding_complete,
      'oauth_profile_completed', v_profile.oauth_profile_completed,
      'app_state', coalesce(v_profile.app_state, '{}'::jsonb)
    );
  end if;

  v_name := coalesce(nullif(trim(p_display_name), ''), 'Supporter');
  v_norm := public.normalize_display_name(v_name);
  v_oauth_done := p_oauth_profile_completed;
  v_is_uuid := p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

  if v_norm = '' or length(v_name) < 2 or length(v_name) > 24 then
    v_name := 'Supporter';
    v_norm := public.normalize_display_name(v_name);
    v_oauth_done := false;
  end if;

  if exists (
    select 1
    from public.profiles o
    where coalesce(
      nullif(trim(o.display_name_normalized), ''),
      public.normalize_display_name(o.display_name)
    ) = v_norm
  ) then
    v_oauth_done := false;
    v_name := left(v_name, 18) || '_' || right(replace(gen_random_uuid()::text, '-', ''), 4);
    v_norm := public.normalize_display_name(v_name);
  end if;

  if v_is_uuid then
    insert into public.profiles (
      id,
      clerk_id,
      display_name,
      display_name_normalized,
      onboarding_complete,
      app_state,
      oauth_profile_completed
    )
    values (
      p_actor_key::uuid,
      p_actor_key,
      v_name,
      v_norm,
      false,
      '{}'::jsonb,
      v_oauth_done
    )
    returning * into v_profile;
  else
    insert into public.profiles (
      clerk_id,
      display_name,
      display_name_normalized,
      onboarding_complete,
      app_state,
      oauth_profile_completed
    )
    values (
      p_actor_key,
      v_name,
      v_norm,
      false,
      '{}'::jsonb,
      v_oauth_done
    )
    returning * into v_profile;
  end if;

  return jsonb_build_object(
    'ok', true,
    'created', true,
    'id', v_profile.id,
    'display_name', v_profile.display_name,
    'onboarding_complete', v_profile.onboarding_complete,
    'oauth_profile_completed', v_profile.oauth_profile_completed,
    'app_state', coalesce(v_profile.app_state, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.check_display_name_available(text) from public;
grant execute on function public.check_display_name_available(text) to anon, authenticated;
