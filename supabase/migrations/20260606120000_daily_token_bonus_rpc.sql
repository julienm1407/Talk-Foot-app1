-- Bonus jetons quotidien : une seule réclamation par jour (Europe/Paris, ouverture 10h).
-- Empêche le spam client (refresh / manipulation app_state).

create or replace function public.claim_daily_token_bonus(
  p_actor_key text,
  p_amount int default 35,
  p_bonus_hour int default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_now timestamptz;
  v_day text;
  v_wallet jsonb;
  v_tokens int;
  v_medals int;
  v_last text;
  v_new_wallet jsonb;
  v_new_app jsonb;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_actor');
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 500 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'reason', 'profile_not_found');
  end if;

  v_now := timezone('Europe/Paris', now());
  v_day := to_char(v_now, 'YYYY-MM-DD');

  if extract(hour from v_now)::int < p_bonus_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'not_open_yet',
      'claim_day_key', v_day
    );
  end if;

  select * into v_profile
  from public.profiles p
  where p.id = v_profile.id
  for update;

  v_wallet := coalesce(v_profile.app_state -> 'wallet', '{}'::jsonb);
  v_last := nullif(trim(v_wallet ->> 'lastDailyTokenGrant'), '');

  if v_last = v_day then
    return jsonb_build_object(
      'ok', false,
      'reason', 'already_claimed',
      'claim_day_key', v_day,
      'wallet', v_wallet
    );
  end if;

  v_tokens := greatest(0, coalesce((v_wallet ->> 'tokens')::int, 100));
  v_medals := greatest(0, coalesce((v_wallet ->> 'medals')::int, 0));

  v_new_wallet := jsonb_build_object(
    'tokens', v_tokens + p_amount,
    'medals', v_medals,
    'lastDailyTokenGrant', v_day
  );

  v_new_app := jsonb_set(
    coalesce(v_profile.app_state, '{}'::jsonb),
    '{wallet}',
    v_new_wallet,
    true
  );

  update public.profiles
  set app_state = v_new_app
  where id = v_profile.id;

  return jsonb_build_object(
    'ok', true,
    'amount', p_amount,
    'claim_day_key', v_day,
    'wallet', v_new_wallet
  );
end;
$$;

revoke all on function public.claim_daily_token_bonus(text, int, int) from public;
grant execute on function public.claim_daily_token_bonus(text, int, int) to anon, authenticated;

comment on function public.claim_daily_token_bonus is
  'Crédite le bonus jetons quotidien une fois par jour (10h Europe/Paris). Source de vérité serveur.';
