-- Stripe fulfill : écriture app_state réservée au service_role (via GRANT, sans check JWT fragile).

create or replace function public.talkfoot_is_service_role()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

-- Sécurité = GRANT execute TO service_role uniquement (pas de check JWT interne).
create or replace function public.talkfoot_service_write_app_state(
  p_profile_id uuid,
  p_app_state jsonb,
  p_onboarding_complete boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  if p_profile_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_profile');
  end if;
  if p_app_state is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_app_state');
  end if;

  perform set_config('talkfoot.allow_app_state_write', '1', true);

  update public.profiles
  set
    app_state = p_app_state,
    onboarding_complete = coalesce(p_onboarding_complete, onboarding_complete)
  where id = p_profile_id;

  get diagnostics v_rows = row_count;
  if v_rows < 1 then
    return jsonb_build_object('ok', false, 'error', 'update_failed');
  end if;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', coalesce(sqlerrm, 'write_failed'));
end;
$$;

revoke all on function public.talkfoot_service_write_app_state(uuid, jsonb, boolean) from public;
revoke all on function public.talkfoot_service_write_app_state(uuid, jsonb, boolean) from anon, authenticated;
grant execute on function public.talkfoot_service_write_app_state(uuid, jsonb, boolean) to service_role;

grant execute on function public.get_talkfoot_user_snapshot(text) to service_role;
grant execute on function public.ensure_talkfoot_profile(text, text, boolean) to service_role;
grant execute on function public.save_talkfoot_user_app_state(text, jsonb, boolean) to service_role;
grant execute on function public.resolve_talkfoot_profile(text) to service_role;
