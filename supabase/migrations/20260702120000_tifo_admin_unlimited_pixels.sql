-- Comptes admin Talk Foot : pixels tifo illimités (compléter la grille si besoin).

create or replace function public.sync_match_tifo_engagement_bonuses(
  p_group_id text,
  p_match_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_day date := (timezone('utc', now()))::date;
  v_day_start timestamptz := public.tifo_engagement_day_start_utc(v_day);
  v_day_end timestamptz := v_day_start + interval '1 day';
  v_bonus_delta smallint := 0;
  v_placement_count smallint := 0;
  v_bonus_allowance smallint := 0;
  v_has_chat boolean := false;
  v_has_like boolean := false;
  v_has_debate boolean := false;
  v_has_bet boolean := false;
  v_live_msg_count int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_group_id is null or length(trim(p_group_id)) = 0 then
    raise exception 'invalid_group';
  end if;
  if p_match_id is null or length(trim(p_match_id)) = 0 then
    raise exception 'invalid_match';
  end if;

  if public.talkfoot_is_admin_actor() then
    return jsonb_build_object(
      'placement_count', 0,
      'bonus_allowance', 0,
      'daily_limit', 999999,
      'remaining', 999999,
      'new_bonus_pixels', 0,
      'admin_unlimited', true
    );
  end if;

  insert into public.match_tifo_pixel_usage (user_id, group_id, match_id, usage_date, placement_count, bonus_allowance)
  values (v_uid, p_group_id, p_match_id, v_day, 0, 0)
  on conflict (user_id, group_id, match_id, usage_date) do nothing;

  select exists (
    select 1
    from public.live_match_messages m
    where m.user_id = v_uid
      and m.match_id = p_match_id
      and m.created_at >= v_day_start
      and m.created_at < v_day_end
  ) or exists (
    select 1
    from public.supporter_group_channel_messages m
    where m.user_id = v_uid
      and m.group_id = p_group_id
      and m.created_at >= v_day_start
      and m.created_at < v_day_end
  )
  into v_has_chat;

  select count(*)::int
  into v_live_msg_count
  from public.live_match_messages m
  where m.user_id = v_uid
    and m.match_id = p_match_id
    and m.created_at >= v_day_start
    and m.created_at < v_day_end;

  select exists (
    select 1
    from public.live_match_message_likes l
    join public.live_match_messages m on m.id = l.message_id
    where l.user_id = v_uid
      and m.match_id = p_match_id
      and l.created_at >= v_day_start
      and l.created_at < v_day_end
  )
  into v_has_like;

  select exists (
    select 1
    from public.debate_messages dm
    join public.debates d on d.id = dm.debate_id
    where dm.user_id = v_uid
      and d.group_id = p_group_id
      and dm.created_at >= v_day_start
      and dm.created_at < v_day_end
  )
  into v_has_debate;

  select exists (
    select 1
    from public.user_bets b
    where b.user_id = v_uid
      and b.match_id = p_match_id
      and b.placed_at >= v_day_start
      and b.placed_at < v_day_end
  )
  into v_has_bet;

  if v_has_chat
     and not exists (
       select 1
       from public.match_tifo_pixel_bonus_claims c
       where c.user_id = v_uid
         and c.group_id = p_group_id
         and c.match_id = p_match_id
         and c.usage_date = v_day
         and c.bonus_kind = 'chat_sent'
     ) then
    insert into public.match_tifo_pixel_bonus_claims (user_id, group_id, match_id, usage_date, bonus_kind, pixels)
    values (v_uid, p_group_id, p_match_id, v_day, 'chat_sent', 3);
    v_bonus_delta := v_bonus_delta + 3;
  end if;

  if v_has_like
     and not exists (
       select 1
       from public.match_tifo_pixel_bonus_claims c
       where c.user_id = v_uid
         and c.group_id = p_group_id
         and c.match_id = p_match_id
         and c.usage_date = v_day
         and c.bonus_kind = 'message_liked'
     ) then
    insert into public.match_tifo_pixel_bonus_claims (user_id, group_id, match_id, usage_date, bonus_kind, pixels)
    values (v_uid, p_group_id, p_match_id, v_day, 'message_liked', 1);
    v_bonus_delta := v_bonus_delta + 1;
  end if;

  if v_has_debate
     and not exists (
       select 1
       from public.match_tifo_pixel_bonus_claims c
       where c.user_id = v_uid
         and c.group_id = p_group_id
         and c.match_id = p_match_id
         and c.usage_date = v_day
         and c.bonus_kind = 'debate_reply'
     ) then
    insert into public.match_tifo_pixel_bonus_claims (user_id, group_id, match_id, usage_date, bonus_kind, pixels)
    values (v_uid, p_group_id, p_match_id, v_day, 'debate_reply', 2);
    v_bonus_delta := v_bonus_delta + 2;
  end if;

  if v_has_bet
     and not exists (
       select 1
       from public.match_tifo_pixel_bonus_claims c
       where c.user_id = v_uid
         and c.group_id = p_group_id
         and c.match_id = p_match_id
         and c.usage_date = v_day
         and c.bonus_kind = 'match_bet'
     ) then
    insert into public.match_tifo_pixel_bonus_claims (user_id, group_id, match_id, usage_date, bonus_kind, pixels)
    values (v_uid, p_group_id, p_match_id, v_day, 'match_bet', 3);
    v_bonus_delta := v_bonus_delta + 3;
  end if;

  if v_live_msg_count >= 10
     and not exists (
       select 1
       from public.match_tifo_pixel_bonus_claims c
       where c.user_id = v_uid
         and c.group_id = p_group_id
         and c.match_id = p_match_id
         and c.usage_date = v_day
         and c.bonus_kind = 'chat_active_10'
     ) then
    insert into public.match_tifo_pixel_bonus_claims (user_id, group_id, match_id, usage_date, bonus_kind, pixels)
    values (v_uid, p_group_id, p_match_id, v_day, 'chat_active_10', 2);
    v_bonus_delta := v_bonus_delta + 2;
  end if;

  if v_bonus_delta > 0 then
    update public.match_tifo_pixel_usage
    set bonus_allowance = bonus_allowance + v_bonus_delta
    where user_id = v_uid
      and group_id = p_group_id
      and match_id = p_match_id
      and usage_date = v_day;
  end if;

  select u.placement_count, u.bonus_allowance
  into v_placement_count, v_bonus_allowance
  from public.match_tifo_pixel_usage u
  where u.user_id = v_uid
    and u.group_id = p_group_id
    and u.match_id = p_match_id
    and u.usage_date = v_day;

  return jsonb_build_object(
    'placement_count', coalesce(v_placement_count, 0),
    'bonus_allowance', coalesce(v_bonus_allowance, 0),
    'daily_limit', 3 + coalesce(v_bonus_allowance, 0),
    'remaining', greatest(0, 3 + coalesce(v_bonus_allowance, 0) - coalesce(v_placement_count, 0)),
    'new_bonus_pixels', v_bonus_delta
  );
end;
$$;

create or replace function public.place_match_tifo_pixel(
  p_group_id text,
  p_match_id text,
  p_x int,
  p_y int,
  p_color text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_day date := (timezone('utc', now()))::date;
  v_count int;
  v_bonus_allowance smallint := 0;
  v_daily_limit int;
  v_prev_user_id uuid;
  v_charges_quota boolean;
  v_is_admin boolean := public.talkfoot_is_admin_actor();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_group_id is null or length(trim(p_group_id)) = 0 then
    raise exception 'invalid_group';
  end if;
  if p_match_id is null or length(trim(p_match_id)) = 0 then
    raise exception 'invalid_match';
  end if;
  if p_x < 0 or p_x >= 36 or p_y < 0 or p_y >= 22 then
    raise exception 'out_of_bounds';
  end if;
  if p_color is null or length(trim(p_color)) = 0 or length(p_color) > 32 then
    raise exception 'invalid_color';
  end if;

  if to_regprocedure('public.sync_match_tifo_engagement_bonuses(text,text)') is not null then
    perform public.sync_match_tifo_engagement_bonuses(p_group_id, p_match_id);
  end if;

  select user_id
  into v_prev_user_id
  from public.match_tifo_pixels
  where group_id = p_group_id
    and match_id = p_match_id
    and x = p_x::smallint
    and y = p_y::smallint;

  v_charges_quota := v_prev_user_id is null or v_prev_user_id <> v_uid;

  if v_charges_quota and not v_is_admin then
    insert into public.match_tifo_pixel_usage (user_id, group_id, match_id, usage_date, placement_count, bonus_allowance)
    values (v_uid, p_group_id, p_match_id, v_day, 0, 0)
    on conflict (user_id, group_id, match_id, usage_date) do nothing;

    select placement_count, bonus_allowance
    into v_count, v_bonus_allowance
    from public.match_tifo_pixel_usage
    where user_id = v_uid
      and group_id = p_group_id
      and match_id = p_match_id
      and usage_date = v_day
    for update;

    v_daily_limit := 3 + coalesce(v_bonus_allowance, 0);

    if v_count >= v_daily_limit then
      raise exception 'daily_limit' using errcode = 'P0001';
    end if;
  end if;

  insert into public.match_tifo_pixels (group_id, match_id, x, y, color, user_id)
  values (p_group_id, p_match_id, p_x::smallint, p_y::smallint, p_color, v_uid)
  on conflict (group_id, match_id, x, y) do update
    set color = excluded.color,
        user_id = excluded.user_id,
        updated_at = now();

  if v_charges_quota and not v_is_admin then
    update public.match_tifo_pixel_usage
    set placement_count = placement_count + 1
    where user_id = v_uid
      and group_id = p_group_id
      and match_id = p_match_id
      and usage_date = v_day;
  end if;
end;
$$;

comment on function public.place_match_tifo_pixel is
  'Place ou écrase un pixel tifo. Quota journalier ignoré pour les admins Talk Foot (admin_users).';
