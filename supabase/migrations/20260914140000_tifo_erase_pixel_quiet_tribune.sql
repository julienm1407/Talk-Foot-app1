-- Gomme tifo : n’importe quel supporter connecté peut retirer un pixel
-- tant que peu de personnes ont déjà peint (tribune calme).

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
  v_painters int;
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

  delete from public.match_tifo_pixels
  where group_id = p_group_id
    and match_id = p_match_id
    and x = p_x::smallint
    and y = p_y::smallint;
end;
$$;

comment on function public.erase_match_tifo_pixel is
  'Retire un pixel tifo si la tribune est calme (≤ 8 peintres distincts).';

revoke all on function public.erase_match_tifo_pixel(text, text, int, int) from public;
grant execute on function public.erase_match_tifo_pixel(text, text, int, int) to authenticated;
