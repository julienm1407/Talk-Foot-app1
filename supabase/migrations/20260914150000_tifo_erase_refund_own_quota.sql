-- Gomme : si tu effaces TON pixel, le quota du jour est rendu.

create or replace function public.erase_match_tifo_pixel(
  p_group_id text,
  p_match_id text,
  p_x int,
  p_y int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_day date := (timezone('utc', now()))::date;
  v_painters int;
  v_owner uuid;
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

  select count(distinct user_id)
  into v_painters
  from public.match_tifo_pixels
  where group_id = p_group_id
    and match_id = p_match_id;

  if not v_is_admin and coalesce(v_painters, 0) > 8 then
    raise exception 'tribune_busy' using errcode = 'P0001';
  end if;

  select user_id
  into v_owner
  from public.match_tifo_pixels
  where group_id = p_group_id
    and match_id = p_match_id
    and x = p_x::smallint
    and y = p_y::smallint;

  delete from public.match_tifo_pixels
  where group_id = p_group_id
    and match_id = p_match_id
    and x = p_x::smallint
    and y = p_y::smallint;

  if v_owner is not null and v_owner = v_uid and not v_is_admin then
    update public.match_tifo_pixel_usage
    set placement_count = greatest(0, placement_count - 1)
    where user_id = v_uid
      and group_id = p_group_id
      and match_id = p_match_id
      and usage_date = v_day;
  end if;
end;
$$;

comment on function public.erase_match_tifo_pixel is
  'Retire un pixel tifo (tribune calme). Effacer son propre pixel rend 1 quota du jour.';
