-- Tifo pixel : une grille par groupe (pas partagée entre salons) + suppression réservée au propriétaire.

truncate table public.match_tifo_pixels;
truncate table public.match_tifo_pixel_usage;

alter table public.match_tifo_pixels
  add column if not exists group_id text;

update public.match_tifo_pixels set group_id = '_legacy' where group_id is null;
alter table public.match_tifo_pixels alter column group_id set not null;

alter table public.match_tifo_pixels drop constraint if exists match_tifo_pixels_pkey;
alter table public.match_tifo_pixels
  add primary key (group_id, match_id, x, y);

drop index if exists public.match_tifo_pixels_match_idx;
create index if not exists match_tifo_pixels_group_match_idx
  on public.match_tifo_pixels (group_id, match_id);

alter table public.match_tifo_pixel_usage
  add column if not exists group_id text;

update public.match_tifo_pixel_usage set group_id = '_legacy' where group_id is null;
alter table public.match_tifo_pixel_usage alter column group_id set not null;

alter table public.match_tifo_pixel_usage drop constraint if exists match_tifo_pixel_usage_pkey;
alter table public.match_tifo_pixel_usage
  add primary key (user_id, group_id, match_id, usage_date);

drop function if exists public.place_match_tifo_pixel(text, int, int, text);

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
  values (p_group_id, p_match_id, p_x::smallint, p_y::smallint, p_color, v_uid)
  on conflict (group_id, match_id, x, y) do update
    set color = excluded.color,
        user_id = excluded.user_id,
        updated_at = now();

  update public.match_tifo_pixel_usage
  set placement_count = placement_count + 1
  where user_id = v_uid
    and group_id = p_group_id
    and match_id = p_match_id
    and usage_date = v_day;
end;
$$;

create or replace function public.delete_match_tifo_pixel_admin(
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
  v_is_owner boolean;
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

  select exists (
    select 1
    from public.supporter_groups g
    where g.id = p_group_id
      and g.owner_id = v_uid
  ) into v_is_owner;

  if not coalesce(v_is_owner, false) then
    raise exception 'not_group_owner' using errcode = 'P0001';
  end if;

  delete from public.match_tifo_pixels
  where group_id = p_group_id
    and match_id = p_match_id
    and x = p_x::smallint
    and y = p_y::smallint;
end;
$$;

revoke all on function public.place_match_tifo_pixel(text, text, int, int, text) from public;
grant execute on function public.place_match_tifo_pixel(text, text, int, int, text) to authenticated;

revoke all on function public.delete_match_tifo_pixel_admin(text, text, int, int) from public;
grant execute on function public.delete_match_tifo_pixel_admin(text, text, int, int) to authenticated;
