-- Tifo pixel : une case occupée ne peut pas être réécrite (évite missclics + quota gaspillé).

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

  if exists (
    select 1
    from public.match_tifo_pixels
    where group_id = p_group_id
      and match_id = p_match_id
      and x = p_x::smallint
      and y = p_y::smallint
  ) then
    raise exception 'cell_occupied' using errcode = 'P0001';
  end if;

  insert into public.match_tifo_pixel_usage (user_id, group_id, match_id, usage_date, placement_count)
  values (v_uid, p_group_id, p_match_id, v_day, 0)
  on conflict (user_id, group_id, match_id, usage_date) do nothing;

  select placement_count into v_count
  from public.match_tifo_pixel_usage
  where user_id = v_uid
    and group_id = p_group_id
    and match_id = p_match_id
    and usage_date = v_day
  for update;

  if v_count >= 3 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.match_tifo_pixels (group_id, match_id, x, y, color, user_id)
  values (p_group_id, p_match_id, p_x::smallint, p_y::smallint, p_color, v_uid);

  update public.match_tifo_pixel_usage
  set placement_count = placement_count + 1
  where user_id = v_uid
    and group_id = p_group_id
    and match_id = p_match_id
    and usage_date = v_day;
end;
$$;

comment on function public.place_match_tifo_pixel is
  'Place un pixel tifo : refuse si la case est déjà occupée (pas d’écrasement).';
