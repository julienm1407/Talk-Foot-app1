-- Réparation : place_match_tifo_pixel doit respecter bonus_allowance (3 + bonus).
-- Si seule la migration 20260628120000 a été appliquée, le client affiche 9 px mais le serveur bloque à 3.

alter table public.match_tifo_pixel_usage
  add column if not exists bonus_allowance smallint not null default 0
  check (bonus_allowance >= 0 and bonus_allowance <= 255);

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
  if p_color is null or length(trim(p_color)) = 0 or length(p_color) > 16 then
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

  if v_charges_quota then
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

  if v_charges_quota then
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
  'Place un pixel tifo : quota 3 + bonus_allowance ; correction gratuite sur son propre pixel.';
