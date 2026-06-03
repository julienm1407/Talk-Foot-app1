-- Sauvegarde / lecture profil pour comptes Clerk (RLS auth.uid() ne s’applique pas).
-- Même modèle que get_display_name_status / change_display_name (security definer + p_actor_key).

create or replace function public.resolve_talkfoot_profile(p_actor_key text)
returns public.profiles
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_is_uuid boolean;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return null;
  end if;

  v_is_uuid := p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

  select * into v_profile
  from public.profiles p
  where (v_is_uuid and p.id::text = p_actor_key) or p.clerk_id = p_actor_key
  limit 1;

  return v_profile;
end;
$$;

create or replace function public.get_talkfoot_user_snapshot(p_actor_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_profile.id,
    'display_name', v_profile.display_name,
    'onboarding_complete', v_profile.onboarding_complete,
    'oauth_profile_completed', v_profile.oauth_profile_completed,
    'app_state', coalesce(v_profile.app_state, '{}'::jsonb)
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
  v_is_uuid := p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

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
      '{}'::jsonb,
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
      '{}'::jsonb,
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
end;
$$;

create or replace function public.save_talkfoot_user_app_state(
  p_actor_key text,
  p_app_state jsonb,
  p_onboarding_complete boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_rows int;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if p_app_state is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_app_state');
  end if;

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  update public.profiles
  set
    app_state = p_app_state,
    onboarding_complete = coalesce(p_onboarding_complete, onboarding_complete)
  where id = v_profile.id;

  get diagnostics v_rows = row_count;
  if v_rows < 1 then
    return jsonb_build_object('ok', false, 'error', 'update_failed');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.resolve_talkfoot_profile(text) from public;
revoke all on function public.get_talkfoot_user_snapshot(text) from public;
revoke all on function public.ensure_talkfoot_profile(text, text, boolean) from public;
revoke all on function public.save_talkfoot_user_app_state(text, jsonb, boolean) from public;

grant execute on function public.get_talkfoot_user_snapshot(text) to anon, authenticated;
grant execute on function public.ensure_talkfoot_profile(text, text, boolean) to anon, authenticated;
grant execute on function public.save_talkfoot_user_app_state(text, jsonb, boolean) to anon, authenticated;

comment on function public.save_talkfoot_user_app_state is
  'Persiste app_state (wallet, inventaire boutique) pour Clerk et Supabase Auth via p_actor_key.';
