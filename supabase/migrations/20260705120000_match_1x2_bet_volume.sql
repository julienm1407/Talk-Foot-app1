-- Volume communautaire des paris 1N2 par match (barres sous les cotes).

create table if not exists public.match_bet_1x2_counts (
  match_id text not null,
  selection text not null check (selection in ('home', 'draw', 'away')),
  bet_count integer not null default 0 check (bet_count >= 0),
  primary key (match_id, selection)
);

alter table public.match_bet_1x2_counts enable row level security;

create policy "match_bet_1x2_counts_read_all"
  on public.match_bet_1x2_counts
  for select
  to anon, authenticated
  using (true);

create or replace function public.get_match_1x2_bet_counts(p_match_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'home', coalesce((select bet_count from public.match_bet_1x2_counts where match_id = p_match_id and selection = 'home'), 0),
    'draw', coalesce((select bet_count from public.match_bet_1x2_counts where match_id = p_match_id and selection = 'draw'), 0),
    'away', coalesce((select bet_count from public.match_bet_1x2_counts where match_id = p_match_id and selection = 'away'), 0)
  );
$$;

create or replace function public.record_match_1x2_bet(p_match_id text, p_selection text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_match_id is null or length(trim(p_match_id)) = 0 then
    raise exception 'match_id required';
  end if;
  if p_selection not in ('home', 'draw', 'away') then
    raise exception 'invalid selection';
  end if;

  insert into public.match_bet_1x2_counts (match_id, selection, bet_count)
  values (trim(p_match_id), p_selection, 1)
  on conflict (match_id, selection) do update
    set bet_count = public.match_bet_1x2_counts.bet_count + 1;

  return public.get_match_1x2_bet_counts(trim(p_match_id));
end;
$$;

grant execute on function public.get_match_1x2_bet_counts(text) to anon, authenticated;
grant execute on function public.record_match_1x2_bet(text, text) to authenticated;
