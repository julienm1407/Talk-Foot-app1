-- Vérifie la VRAIE politique médailles (pas le greatest(0, x) anti-négatif).
-- Run dans Supabase → SQL Editor. Attendu : medals_policy = 'spend_ok'

with def as (
  select lower(pg_get_functiondef(
    'public.talkfoot_merge_client_app_state(jsonb,jsonb)'::regprocedure
  )) as src
)
select
  case
    -- Ancien bug : medals = greatest(0, existing, incoming) → annule les dépenses
    when src like '%''medals'', greatest(%'
      or src like '%''medals'',greatest(%'
      or src ~ '''medals''[[:space:]]*,[[:space:]]*greatest[[:space:]]*\('
    then 'BROKEN_GREATEST_MEDALS'
    when src like '%v_incoming_medals < v_existing_medals%'
     and src like '%owneditemids%'
    then 'spend_ok'
    else 'CHECK_MANUALLY'
  end as medals_policy
from def;

-- Test comportemental : dépense 3000 → 2900 doit gagner, inventaire doit s’unir.
select
  (public.talkfoot_merge_client_app_state(
    '{"wallet":{"tokens":100000,"medals":3000},"profile":{"ownedItemIds":[]},"bets":[]}'::jsonb,
    '{"wallet":{"tokens":100000,"medals":2900},"profile":{"ownedItemIds":["pack-test"]},"bets":[]}'::jsonb
  ) -> 'wallet' ->> 'medals') as medals_after_spend,
  (public.talkfoot_merge_client_app_state(
    '{"wallet":{"tokens":100000,"medals":3000},"profile":{"ownedItemIds":[]},"bets":[]}'::jsonb,
    '{"wallet":{"tokens":100000,"medals":2900},"profile":{"ownedItemIds":["pack-test"]},"bets":[]}'::jsonb
  ) -> 'profile' -> 'ownedItemIds') as owned_after_spend;
-- Attendu : medals_after_spend = 2900 , owned_after_spend contient "pack-test"
