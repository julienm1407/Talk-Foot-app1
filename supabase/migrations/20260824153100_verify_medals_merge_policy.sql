-- Vérifie que le merge boutique n’utilise plus GREATEST sur les médailles.
-- Dans Supabase → SQL Editor → Run. Tu dois voir medals_policy = 'spend_ok'.

select
  case
    when pg_get_functiondef('public.talkfoot_merge_client_app_state(jsonb,jsonb)'::regprocedure)
      like '%greatest(%medals%'
      or pg_get_functiondef('public.talkfoot_merge_client_app_state(jsonb,jsonb)'::regprocedure)
      like '%GREATEST(%medals%'
    then 'BROKEN_GREATEST_MEDALS'
    when pg_get_functiondef('public.talkfoot_merge_client_app_state(jsonb,jsonb)'::regprocedure)
      like '%ownedItemIds%'
     and pg_get_functiondef('public.talkfoot_merge_client_app_state(jsonb,jsonb)'::regprocedure)
      like '%v_incoming_medals < v_existing_medals%'
    then 'spend_ok'
    else 'CHECK_MANUALLY'
  end as medals_policy;
