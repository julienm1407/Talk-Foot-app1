-- Profils publics (PP modulaire + pseudo) pour chat / classement — sans exposer wallet, paris, abonnement.
-- get_talkfoot_user_snapshot exige talkfoot_assert_actor_caller (propre compte uniquement).

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
    if v_modular is null or v_modular = 'null'::jsonb or jsonb_typeof(v_modular) <> 'object' then
      v_modular := null;
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

revoke all on function public.get_talkfoot_public_profiles(text[]) from public;
grant execute on function public.get_talkfoot_public_profiles(text[]) to anon, authenticated;

comment on function public.get_talkfoot_public_profiles is
  'Lecture batch des profils publics (pseudo + avatar modulaire) pour chat et classement — données non sensibles uniquement.';
