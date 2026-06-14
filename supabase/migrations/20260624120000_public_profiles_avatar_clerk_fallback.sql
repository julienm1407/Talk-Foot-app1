-- Chat tribune / débats : les messages utilisent auth.uid() (session Supabase).
-- L'avatar custom est parfois sur le profil Clerk (clerk_id) sans être copié sur la ligne chat.
-- Fallback : lire modularAvatar du profil Clerk lié via talkfoot_actor_sessions.

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
    if v_modular is null
      or v_modular = 'null'::jsonb
      or jsonb_typeof(v_modular) <> 'object'
      or coalesce(v_modular -> 'data', 'null'::jsonb) = 'null'::jsonb
    then
      select coalesce(p_clerk.app_state, '{}'::jsonb) -> 'profile' -> 'modularAvatar'
      into v_modular
      from public.talkfoot_actor_sessions s
      join public.profiles p_clerk on p_clerk.clerk_id = s.actor_key
      where s.supabase_user_id = v_profile.id
      limit 1;

      if v_modular is null
        or v_modular = 'null'::jsonb
        or jsonb_typeof(v_modular) <> 'object'
        or coalesce(v_modular -> 'data', 'null'::jsonb) = 'null'::jsonb
      then
        v_modular := null;
      end if;
    end if;

    v_items := v_items || jsonb_build_array(
      jsonb_build_object(
        'actor_key', v_key,
        'profile_id', v_profile.id,
        'display_name', v_profile.display_name,
        'modular_avatar', v_modular
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
  'Profils publics chat : pseudo + avatar modulaire, avec repli sur le profil Clerk lié si la ligne auth.uid() est vide.';
