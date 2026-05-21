-- Tifo pixel collaboratif par match (grille partagée, 3 placements / jour / utilisateur).

create table if not exists public.match_tifo_pixels (
  match_id text not null,
  x smallint not null check (x >= 0 and x < 36),
  y smallint not null check (y >= 0 and y < 22),
  color text not null check (char_length(color) <= 16),
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (match_id, x, y)
);

create index if not exists match_tifo_pixels_match_idx
  on public.match_tifo_pixels (match_id);

create table if not exists public.match_tifo_pixel_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  usage_date date not null,
  placement_count smallint not null default 0 check (placement_count >= 0 and placement_count <= 255),
  primary key (user_id, match_id, usage_date)
);

alter table public.match_tifo_pixels enable row level security;
alter table public.match_tifo_pixel_usage enable row level security;

drop policy if exists "match_tifo_pixels_select" on public.match_tifo_pixels;
create policy "match_tifo_pixels_select"
  on public.match_tifo_pixels for select
  to authenticated
  using (true);

drop policy if exists "match_tifo_pixel_usage_select_own" on public.match_tifo_pixel_usage;
create policy "match_tifo_pixel_usage_select_own"
  on public.match_tifo_pixel_usage for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.place_match_tifo_pixel(
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
  if p_match_id is null or length(trim(p_match_id)) = 0 then
    raise exception 'invalid_match';
  end if;
  if p_x < 0 or p_x >= 36 or p_y < 0 or p_y >= 22 then
    raise exception 'out_of_bounds';
  end if;
  if p_color is null or length(trim(p_color)) = 0 or length(p_color) > 16 then
    raise exception 'invalid_color';
  end if;

  insert into public.match_tifo_pixel_usage (user_id, match_id, usage_date, placement_count)
  values (v_uid, p_match_id, v_day, 0)
  on conflict (user_id, match_id, usage_date) do nothing;

  select placement_count into v_count
  from public.match_tifo_pixel_usage
  where user_id = v_uid and match_id = p_match_id and usage_date = v_day
  for update;

  if v_count >= 3 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.match_tifo_pixels (match_id, x, y, color, user_id)
  values (p_match_id, p_x::smallint, p_y::smallint, p_color, v_uid)
  on conflict (match_id, x, y) do update
    set color = excluded.color,
        user_id = excluded.user_id,
        updated_at = now();

  update public.match_tifo_pixel_usage
  set placement_count = placement_count + 1
  where user_id = v_uid and match_id = p_match_id and usage_date = v_day;
end;
$$;

revoke all on function public.place_match_tifo_pixel(text, int, int, text) from public;
grant execute on function public.place_match_tifo_pixel(text, int, int, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_tifo_pixels'
  ) then
    alter publication supabase_realtime add table public.match_tifo_pixels;
  end if;
end$$;
