-- Ne jamais effacer les paris cloud quand le client envoie un app_state sans bets (race sync / reset local).

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
begin
  v_merged_wallet := v_incoming_wallet || jsonb_build_object(
    'medals', coalesce(v_existing_wallet -> 'medals', v_incoming_wallet -> 'medals', '0'::jsonb)
  );

  if v_existing_wallet ? 'lastDailyTokenGrant' then
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

  return v_result;
end;
$$;

comment on function public.talkfoot_merge_client_app_state is
  'Fusion app_state client : préserve subscription, médailles, bonus quotidien et paris existants si le client envoie bets=[].';
