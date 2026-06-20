-- Évite qu’un client avec paris « gagné » mais wallet périmé écrase le solde cloud enrichi.

create or replace function public.talkfoot_merge_client_app_state(
  p_existing jsonb,
  p_incoming jsonb
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_existing jsonb := coalesce(p_existing, '{}'::jsonb);
  v_incoming jsonb := coalesce(p_incoming, '{}'::jsonb);
  v_result jsonb := v_incoming;
  v_existing_wallet jsonb := coalesce(v_existing -> 'wallet', '{}'::jsonb);
  v_incoming_wallet jsonb := coalesce(v_incoming -> 'wallet', '{}'::jsonb);
  v_merged_wallet jsonb;
  v_existing_bets jsonb := coalesce(v_existing -> 'bets', '[]'::jsonb);
  v_incoming_bets jsonb := coalesce(v_incoming -> 'bets', '[]'::jsonb);
  v_existing_avatar jsonb := v_existing -> 'profile' -> 'modularAvatar';
  v_incoming_avatar jsonb := v_incoming -> 'profile' -> 'modularAvatar';
  v_existing_has_avatar boolean;
  v_incoming_has_avatar boolean;
  v_existing_tokens int := greatest(0, coalesce((v_existing_wallet ->> 'tokens')::int, 100));
  v_incoming_tokens int := greatest(0, coalesce((v_incoming_wallet ->> 'tokens')::int, 100));
  v_merged_tokens int;
  v_existing_won int := 0;
  v_incoming_won int := 0;
  v_elem jsonb;
begin
  if jsonb_typeof(v_existing_bets) = 'array' then
    for v_elem in select value from jsonb_array_elements(v_existing_bets) as t(value)
    loop
      if coalesce(v_elem ->> 'status', '') = 'won' then
        v_existing_won := v_existing_won + 1;
      end if;
    end loop;
  end if;

  if jsonb_typeof(v_incoming_bets) = 'array' then
    for v_elem in select value from jsonb_array_elements(v_incoming_bets) as t(value)
    loop
      if coalesce(v_elem ->> 'status', '') = 'won' then
        v_incoming_won := v_incoming_won + 1;
      end if;
    end loop;
  end if;

  if v_incoming_tokens = 100 and v_existing_tokens > 100 then
    v_merged_tokens := v_existing_tokens;
  elsif v_incoming_tokens > v_existing_tokens then
    v_merged_tokens := v_incoming_tokens;
  elsif v_incoming_tokens < v_existing_tokens
        and v_incoming_won > v_existing_won then
    -- Paris réglés côté client mais wallet périmé (onglet / appareil stale).
    v_merged_tokens := v_existing_tokens;
  else
    v_merged_tokens := v_incoming_tokens;
  end if;

  v_merged_wallet := jsonb_build_object(
    'tokens', v_merged_tokens,
    'medals', greatest(
      0,
      coalesce((v_existing_wallet ->> 'medals')::int, (v_incoming_wallet ->> 'medals')::int, 0)
    )
  );

  if v_incoming_wallet ? 'lastDailyTokenGrant' then
    v_merged_wallet := v_merged_wallet || jsonb_build_object(
      'lastDailyTokenGrant', v_incoming_wallet -> 'lastDailyTokenGrant'
    );
  elsif v_existing_wallet ? 'lastDailyTokenGrant' then
    v_merged_wallet := v_merged_wallet || jsonb_build_object(
      'lastDailyTokenGrant', v_existing_wallet -> 'lastDailyTokenGrant'
    );
  end if;

  v_result := v_result
    || jsonb_build_object(
      'subscription', coalesce(v_existing -> 'subscription', v_incoming -> 'subscription', '{}'::jsonb),
      'stripeFulfillmentBySessionId', coalesce(
        v_existing -> 'stripeFulfillmentBySessionId',
        v_incoming -> 'stripeFulfillmentBySessionId',
        '{}'::jsonb
      ),
      'adminWalletBootstrapped', coalesce(
        v_existing -> 'adminWalletBootstrapped',
        v_incoming -> 'adminWalletBootstrapped'
      )
    );

  v_result := jsonb_set(v_result, '{wallet}', v_merged_wallet, true);

  if jsonb_typeof(v_incoming_bets) = 'array'
     and jsonb_typeof(v_existing_bets) = 'array'
     and jsonb_array_length(v_incoming_bets) = 0
     and jsonb_array_length(v_existing_bets) > 0 then
    v_result := jsonb_set(v_result, '{bets}', v_existing_bets, true);
  end if;

  v_existing_has_avatar :=
    v_existing_avatar is not null
    and v_existing_avatar <> 'null'::jsonb
    and jsonb_typeof(v_existing_avatar) = 'object'
    and coalesce(v_existing_avatar -> 'data', 'null'::jsonb) <> 'null'::jsonb
    and jsonb_typeof(v_existing_avatar -> 'data') = 'object';

  v_incoming_has_avatar :=
    v_incoming_avatar is not null
    and v_incoming_avatar <> 'null'::jsonb
    and jsonb_typeof(v_incoming_avatar) = 'object'
    and coalesce(v_incoming_avatar -> 'data', 'null'::jsonb) <> 'null'::jsonb
    and jsonb_typeof(v_incoming_avatar -> 'data') = 'object';

  if v_existing_has_avatar and not v_incoming_has_avatar then
    v_result := jsonb_set(v_result, '{profile,modularAvatar}', v_existing_avatar, true);
  end if;

  return v_result;
end;
$$;

comment on function public.talkfoot_merge_client_app_state is
  'Fusion app_state client : préserve jetons serveur si défaut (100) ou paris gagnés sans wallet à jour, médailles max, bonus quotidien, paris et avatar modular.';
