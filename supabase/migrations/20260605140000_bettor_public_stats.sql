-- Stats agrégées parieur pour badges / progression sur les profils publics.

create or replace function public.get_bettor_public_stats(p_actor_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_bets jsonb;
  v_bet jsonb;
  v_status text;
  v_total int := 0;
  v_decided int := 0;
  v_won int := 0;
  v_points numeric := 0;
  v_streak int := 0;
  v_top_comp text := null;
begin
  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_bets := coalesce(v_profile.app_state -> 'bets', '[]'::jsonb);
  if jsonb_typeof(v_bets) <> 'array' then
    v_bets := '[]'::jsonb;
  end if;

  select count(*)::int into v_total
  from jsonb_array_elements(v_bets) as t(elem)
  where t.elem ->> 'status' in ('won', 'lost', 'open');

  for v_bet in
    select t.elem
    from jsonb_array_elements(v_bets) as t(elem)
  loop
    v_status := v_bet ->> 'status';
    if v_status in ('won', 'lost') then
      v_decided := v_decided + 1;
      if v_status = 'won' then
        v_won := v_won + 1;
        v_points := v_points + greatest(
          0,
          coalesce(nullif(v_bet ->> 'payout', '')::numeric, 0)
            - coalesce(nullif(v_bet ->> 'stake', '')::numeric, 0)
        );
      end if;
    end if;
  end loop;

  for v_bet in
    select t.elem
    from jsonb_array_elements(v_bets) as t(elem)
    where t.elem ->> 'status' in ('won', 'lost')
    order by t.elem ->> 'placedAt' desc nulls last
  loop
    if v_bet ->> 'status' = 'won' then
      v_streak := v_streak + 1;
    else
      exit;
    end if;
  end loop;

  select sub.comp into v_top_comp
  from (
    select
      coalesce(nullif(trim(t.elem -> 'matchLabel' ->> 'competition'), ''), 'Autre') as comp,
      count(*)::int as cnt
    from jsonb_array_elements(v_bets) as t(elem)
    group by 1
    order by cnt desc, comp asc
    limit 1
  ) sub
  where sub.cnt > 0;

  return jsonb_build_object(
    'ok', true,
    'total', v_total,
    'decided', v_decided,
    'won', v_won,
    'accuracy', case when v_decided > 0 then round((v_won::numeric / v_decided) * 100)::int else 0 end,
    'points', round(v_points)::int,
    'streak', v_streak,
    'top_competition', v_top_comp
  );
end;
$$;

revoke all on function public.get_bettor_public_stats(text) from public;
grant execute on function public.get_bettor_public_stats(text) to anon, authenticated;

comment on function public.get_bettor_public_stats is
  'Stats agrégées parieur (badges profil public) — sans détail des paris.';
