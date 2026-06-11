-- Paris / pronos visibles entre amis acceptés (lecture seule, pas de wallet ni inventaire).

create or replace function public.get_friend_pronostics(
  p_viewer_actor_key text,
  p_friend_actor_key text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_viewer public.profiles%rowtype;
  v_friend public.profiles%rowtype;
  v_bets jsonb;
begin
  if p_viewer_actor_key is null
    or length(trim(p_viewer_actor_key)) = 0
    or p_friend_actor_key is null
    or length(trim(p_friend_actor_key)) = 0
  then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_viewer := public.resolve_talkfoot_profile(p_viewer_actor_key);
  v_friend := public.resolve_talkfoot_profile(p_friend_actor_key);

  if v_viewer.id is null or v_friend.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if v_viewer.id <> v_friend.id then
    if not exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.user_low = v_viewer.id and f.user_high = v_friend.id)
          or (f.user_high = v_viewer.id and f.user_low = v_friend.id)
        )
    ) then
      return jsonb_build_object('ok', false, 'error', 'not_friends');
    end if;
  end if;

  v_bets := coalesce(v_friend.app_state -> 'bets', '[]'::jsonb);
  if jsonb_typeof(v_bets) <> 'array' then
    v_bets := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'ok', true,
    'bets', v_bets,
    'friend_id', v_friend.id,
    'friend_display_name', v_friend.display_name
  );
end;
$$;

revoke all on function public.get_friend_pronostics(text, text) from public;
grant execute on function public.get_friend_pronostics(text, text) to anon, authenticated;

comment on function public.get_friend_pronostics is
  'Retourne app_state.bets d’un ami accepté (ou soi-même). Pas d’exposition wallet / inventaire.';
