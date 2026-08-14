-- Badge « beta CDM » : tous les comptes existants + inscriptions jusqu'au 14/08/2026 23:59 (Paris).

create or replace function public.talkfoot_cdm_beta_participant_cutoff()
returns timestamptz
language sql
immutable
set search_path = public
as $$
  select timestamptz '2026-08-14 23:59:59.999+02:00';
$$;

create or replace function public.talkfoot_cdm_beta_participant_app_state()
returns jsonb
language sql
stable
set search_path = public
as $$
  select case
    when now() <= public.talkfoot_cdm_beta_participant_cutoff()
      then jsonb_build_object('profile', jsonb_build_object('cdmBetaParticipant', true))
    else '{}'::jsonb
  end;
$$;

-- Comptes déjà inscrits au déploiement.
update public.profiles
set app_state = jsonb_set(
  coalesce(app_state, '{}'::jsonb),
  '{profile,cdmBetaParticipant}',
  'true'::jsonb,
  true
)
where coalesce(app_state -> 'profile' ->> 'cdmBetaParticipant', '') is distinct from 'true';

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
  v_initial_app_state jsonb;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is not null then
    perform public.talkfoot_assert_actor_caller(p_actor_key);
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
  v_is_uuid := public.talkfoot_actor_key_is_uuid(p_actor_key);
  v_initial_app_state := public.talkfoot_cdm_beta_participant_app_state();

  if v_is_uuid then
    insert into public.profiles (
      id,
      clerk_id,
      display_name,
      onboarding_complete,
      app_state,
      oauth_profile_completed
    )
    values (
      p_actor_key::uuid,
      p_actor_key,
      v_name,
      false,
      v_initial_app_state,
      p_oauth_profile_completed
    )
    returning * into v_profile;
  else
    insert into public.profiles (
      clerk_id,
      display_name,
      onboarding_complete,
      app_state,
      oauth_profile_completed
    )
    values (
      p_actor_key,
      v_name,
      false,
      v_initial_app_state,
      p_oauth_profile_completed
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
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(sqlerrm, 'ensure_failed')
    );
end;
$$;

create or replace function public.get_talkfoot_public_profiles(p_actor_keys text[])
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_key text;
  v_profile public.profiles%rowtype;
  v_modular jsonb;
  v_clerk_modular jsonb;
  v_clerk_name text;
  v_clerk_photo text;
  v_photo text;
  v_display_name text;
  v_sub jsonb;
  v_tier text;
  v_cdm_beta boolean;
  v_items jsonb := '[]'::jsonb;
  v_count integer := 0;
begin
  if p_actor_keys is null or cardinality(p_actor_keys) = 0 then
    return jsonb_build_object('ok', true, 'profiles', '[]'::jsonb);
  end if;

  if auth.uid() is null and not public.talkfoot_is_service_role() then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  for v_key in
    select distinct nullif(trim(k), '')
    from unnest(p_actor_keys) as k
    where nullif(trim(k), '') is not null
    limit 100
  loop
    v_profile := public.resolve_talkfoot_profile(v_key);
    if v_profile.id is null then
      continue;
    end if;

    v_modular := coalesce(v_profile.app_state, '{}'::jsonb) -> 'profile' -> 'modularAvatar';
    if not public.talkfoot_modular_avatar_has_data(v_modular) then
      v_modular := null;
    end if;

    v_photo := public.talkfoot_profile_photo_data_url(coalesce(v_profile.app_state, '{}'::jsonb));

    select
      nullif(trim(p_clerk.display_name), ''),
      coalesce(p_clerk.app_state, '{}'::jsonb) -> 'profile' -> 'modularAvatar',
      public.talkfoot_profile_photo_data_url(coalesce(p_clerk.app_state, '{}'::jsonb))
    into v_clerk_name, v_clerk_modular, v_clerk_photo
    from public.talkfoot_actor_sessions s
    join public.profiles p_clerk on p_clerk.clerk_id = s.actor_key
    where s.supabase_user_id = v_profile.id
    limit 1;

    if not public.talkfoot_modular_avatar_has_data(v_clerk_modular) then
      v_clerk_modular := null;
    end if;

    if v_modular is null and v_clerk_modular is not null then
      v_modular := v_clerk_modular;
    elsif v_modular is not null and v_clerk_modular is not null then
      if public.talkfoot_is_free_modular_garment(v_modular -> 'data' ->> 'jersey')
        and not public.talkfoot_is_free_modular_garment(v_clerk_modular -> 'data' ->> 'jersey')
      then
        v_modular := jsonb_set(
          v_modular,
          '{data,jersey}',
          coalesce(v_clerk_modular -> 'data' -> 'jersey', 'null'::jsonb),
          true
        );
      end if;

      if public.talkfoot_is_free_modular_garment(v_modular -> 'data' ->> 'shorts')
        and not public.talkfoot_is_free_modular_garment(v_clerk_modular -> 'data' ->> 'shorts')
      then
        v_modular := jsonb_set(
          v_modular,
          '{data,shorts}',
          coalesce(v_clerk_modular -> 'data' -> 'shorts', 'null'::jsonb),
          true
        );
      end if;

      if public.talkfoot_is_free_modular_garment(v_modular -> 'data' ->> 'shoes')
        and not public.talkfoot_is_free_modular_garment(v_clerk_modular -> 'data' ->> 'shoes')
      then
        v_modular := jsonb_set(
          v_modular,
          '{data,shoes}',
          coalesce(v_clerk_modular -> 'data' -> 'shoes', 'null'::jsonb),
          true
        );
      end if;
    end if;

    if v_photo is null then
      v_photo := v_clerk_photo;
    end if;

    v_display_name := nullif(trim(v_profile.display_name), '');
    if v_display_name is null
      or lower(v_display_name) in ('supporter', 'parieur')
    then
      v_display_name := v_clerk_name;
    end if;
    if v_display_name is null then
      v_display_name := coalesce(nullif(trim(v_profile.display_name), ''), 'Supporter');
    end if;

    v_sub := coalesce(v_profile.app_state -> 'subscription', '{}'::jsonb);
    v_tier := coalesce(v_sub ->> 'tier', 'freemium');
    if v_tier not in ('freemium', 'supporter_plus', 'ambassador') then
      v_tier := 'freemium';
    end if;
    if nullif(v_sub ->> 'activeUntil', '') is not null
      and (v_sub ->> 'activeUntil')::timestamptz < now()
    then
      v_tier := 'freemium';
    end if;

    v_cdm_beta := coalesce((v_profile.app_state -> 'profile' ->> 'cdmBetaParticipant')::boolean, false);

    v_items := v_items || jsonb_build_array(
      jsonb_build_object(
        'actor_key', v_key,
        'profile_id', v_profile.id,
        'display_name', v_display_name,
        'modular_avatar', v_modular,
        'profile_photo_data_url', v_photo,
        'subscription_tier', v_tier,
        'cdm_beta_participant', v_cdm_beta
      )
    );
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'profiles', v_items);
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(sqlerrm, 'public_profiles_failed')
    );
end;
$$;

comment on function public.talkfoot_cdm_beta_participant_cutoff is
  'Date limite (Paris) pour le badge beta CDM Talk Foot.';

comment on function public.get_talkfoot_public_profiles is
  'Profils publics : pseudo, avatar, photo, formule, badge beta CDM.';
