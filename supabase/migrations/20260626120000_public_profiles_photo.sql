-- Profils publics : photo de profil (data URL) pour le chat quand pas d’avatar modulaire custom.

create or replace function public.talkfoot_profile_photo_data_url(p_app_state jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(p_app_state -> 'profile' ->> 'profilePhotoDataUrl', '') like 'data:image/%'
    then p_app_state -> 'profile' ->> 'profilePhotoDataUrl'
    else null
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

    v_items := v_items || jsonb_build_array(
      jsonb_build_object(
        'actor_key', v_key,
        'profile_id', v_profile.id,
        'display_name', v_display_name,
        'modular_avatar', v_modular,
        'profile_photo_data_url', v_photo,
        'subscription_tier', v_tier
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

comment on function public.get_talkfoot_public_profiles is
  'Profils publics : pseudo, avatar modulaire (fusion Clerk), photo profil, formule effective.';
