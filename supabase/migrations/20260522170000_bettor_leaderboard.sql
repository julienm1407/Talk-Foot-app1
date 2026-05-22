-- Classement parieurs : agrégat depuis profiles.app_state.bets (parieurs ayant au moins un pari).

create or replace function public.get_bettor_leaderboard(p_limit integer default 50)
returns table (
  user_id text,
  display_name text,
  score integer,
  wins integer,
  total_bets integer
)
language sql
stable
security definer
set search_path = public
as $$
  with bet_rows as (
    select
      coalesce(nullif(trim(p.clerk_id), ''), p.id::text) as user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Parieur') as display_name,
      b.elem as bet
    from public.profiles p
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(p.app_state -> 'bets') = 'array' then p.app_state -> 'bets'
        else '[]'::jsonb
      end
    ) as b(elem)
    where b.elem is not null and jsonb_typeof(b.elem) = 'object'
  ),
  agg as (
    select
      user_id,
      max(display_name) as display_name,
      count(*)::integer as total_bets,
      count(*) filter (where bet ->> 'status' = 'won')::integer as wins,
      coalesce(
        sum(
          case
            when bet ->> 'status' = 'won' then
              coalesce(
                nullif(bet ->> 'payout', '')::numeric,
                nullif(bet ->> 'stake', '')::numeric * nullif(bet ->> 'odds', '')::numeric,
                0
              )
            else 0
          end
        ),
        0
      )::integer as score
    from bet_rows
    where bet ->> 'status' in ('won', 'lost', 'open', 'cancelled')
    group by user_id
    having count(*) filter (where bet ->> 'status' in ('won', 'lost', 'open')) >= 1
  )
  select user_id, display_name, score, wins, total_bets
  from agg
  order by score desc, wins desc, total_bets desc, display_name asc
  limit greatest(1, least(coalesce(p_limit, 50), 250));
$$;

revoke all on function public.get_bettor_leaderboard(integer) from public;
grant execute on function public.get_bettor_leaderboard(integer) to anon, authenticated;

comment on function public.get_bettor_leaderboard is
  'Classement parieurs actifs (≥1 pari dans app_state.bets), points = gains des paris gagnés.';
