-- Correction admin : scores classement parieurs (cotes / gains erronés).
-- Jojoanna → 1000 pts, LBSLaBanane → 700 pts.

create or replace function public.talkfoot_admin_set_bettor_leaderboard_score(
  p_display_name text,
  p_target_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_bets jsonb;
  v_new_bets jsonb := '[]'::jsonb;
  v_bet jsonb;
  v_elem jsonb;
  v_current numeric := 0;
  v_target integer := greatest(0, coalesce(p_target_score, 0));
  v_scale numeric;
  v_payout numeric;
  v_stake numeric;
  v_new_payout integer;
  v_running integer := 0;
  v_last_won_ord integer := -1;
  v_ord integer := 0;
  v_won_count integer := 0;
begin
  if p_display_name is null or length(trim(p_display_name)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_display_name');
  end if;

  select * into v_profile
  from public.profiles
  where display_name ilike trim(p_display_name)
  order by updated_at desc nulls last
  limit 1;

  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found', 'display_name', trim(p_display_name));
  end if;

  v_bets := coalesce(v_profile.app_state -> 'bets', '[]'::jsonb);
  if jsonb_typeof(v_bets) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'no_bets_array');
  end if;

  for v_bet in select value from jsonb_array_elements(v_bets) as t(value)
  loop
    if v_bet ->> 'status' = 'won' then
      v_won_count := v_won_count + 1;
      v_current := v_current + coalesce(
        nullif(v_bet ->> 'payout', '')::numeric,
        nullif(v_bet ->> 'stake', '')::numeric * nullif(v_bet ->> 'odds', '')::numeric,
        0
      );
    end if;
  end loop;

  if v_won_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'no_won_bets', 'display_name', trim(p_display_name));
  end if;

  if v_current <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_current_score', 'current', v_current);
  end if;

  if round(v_current)::integer = v_target then
    return jsonb_build_object(
      'ok', true,
      'unchanged', true,
      'display_name', v_profile.display_name,
      'user_id', coalesce(nullif(trim(v_profile.clerk_id), ''), v_profile.id::text),
      'score', v_target
    );
  end if;

  v_scale := v_target::numeric / v_current;

  for v_bet in select value from jsonb_array_elements(v_bets) as t(value)
  loop
    v_elem := v_bet;
    if v_bet ->> 'status' = 'won' then
      v_last_won_ord := v_ord;
      v_payout := coalesce(
        nullif(v_bet ->> 'payout', '')::numeric,
        nullif(v_bet ->> 'stake', '')::numeric * nullif(v_bet ->> 'odds', '')::numeric,
        0
      );
      v_stake := greatest(1, coalesce(nullif(v_bet ->> 'stake', '')::numeric, 1));
      v_new_payout := greatest(0, round(v_payout * v_scale)::integer);
      v_running := v_running + v_new_payout;
      v_elem := v_bet || jsonb_build_object(
        'payout', v_new_payout,
        'odds', round((v_new_payout::numeric / v_stake)::numeric, 2)
      );
    end if;
    v_new_bets := v_new_bets || jsonb_build_array(v_elem);
    v_ord := v_ord + 1;
  end loop;

  if v_last_won_ord >= 0 and v_running <> v_target then
    v_elem := v_new_bets -> v_last_won_ord;
    v_stake := greatest(1, coalesce(nullif(v_elem ->> 'stake', '')::numeric, 1));
    v_new_payout := greatest(0, (v_elem ->> 'payout')::integer + (v_target - v_running));
    v_new_bets := jsonb_set(
      v_new_bets,
      array[v_last_won_ord::text],
      v_elem || jsonb_build_object(
        'payout', v_new_payout,
        'odds', round((v_new_payout::numeric / v_stake)::numeric, 2)
      ),
      false
    );
    v_running := v_target;
  end if;

  perform set_config('talkfoot.allow_app_state_write', '1', true);

  update public.profiles
  set app_state = jsonb_set(coalesce(app_state, '{}'::jsonb), '{bets}', v_new_bets, true)
  where id = v_profile.id;

  return jsonb_build_object(
    'ok', true,
    'display_name', v_profile.display_name,
    'user_id', coalesce(nullif(trim(v_profile.clerk_id), ''), v_profile.id::text),
    'previous_score', round(v_current)::integer,
    'score', v_running,
    'won_bets', v_won_count
  );
end;
$$;

revoke all on function public.talkfoot_admin_set_bettor_leaderboard_score(text, integer) from public;
grant execute on function public.talkfoot_admin_set_bettor_leaderboard_score(text, integer) to service_role;

comment on function public.talkfoot_admin_set_bettor_leaderboard_score is
  'Admin : ajuste proportionnellement les payout des paris gagnés pour atteindre un score classement cible.';

select public.talkfoot_admin_set_bettor_leaderboard_score('Jojoanna', 1000);
select public.talkfoot_admin_set_bettor_leaderboard_score('LBSLaBanane', 700);
