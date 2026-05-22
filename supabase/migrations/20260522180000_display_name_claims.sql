-- Pseudo unique + max 2 changements par fenêtre de 14 jours.

create or replace function public.normalize_display_name(raw text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(raw, '')), '\s+', ' ', 'g'));
$$;

alter table public.profiles
  add column if not exists display_name_normalized text,
  add column if not exists display_name_change_count smallint not null default 0,
  add column if not exists display_name_period_start timestamptz,
  add column if not exists display_name_last_changed_at timestamptz;

update public.profiles
set display_name_normalized = public.normalize_display_name(display_name)
where display_name is not null
  and trim(display_name) <> '';

update public.profiles
set display_name_normalized = null
where display_name is null or trim(display_name) = '';

-- Doublons existants (ex. deux « jojoanna ») : le plus ancien garde le pseudo, les autres reçoivent un suffixe unique.
drop index if exists public.profiles_display_name_normalized_key;

with ranked as (
  select
    p.id,
    trim(p.display_name) as base_name,
    p.display_name_normalized as norm,
    row_number() over (
      partition by p.display_name_normalized
      order by p.created_at asc nulls last, p.id asc
    ) as rn
  from public.profiles p
  where p.display_name_normalized is not null
    and p.display_name_normalized <> ''
),
to_fix as (
  select
    id,
    base_name,
    norm,
    rn,
    left(base_name, 18) || '_' || right(replace(id::text, '-', ''), 4) as new_display
  from ranked
  where rn > 1
)
update public.profiles p
set
  display_name = f.new_display,
  display_name_normalized = public.normalize_display_name(f.new_display)
from to_fix f
where p.id = f.id;

create unique index if not exists profiles_display_name_normalized_key
  on public.profiles (display_name_normalized)
  where display_name_normalized is not null and display_name_normalized <> '';

create or replace function public.get_display_name_status(p_actor_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_now timestamptz := now();
  v_window timestamptz;
  v_count int;
  v_next timestamptz;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  select * into v_profile
  from public.profiles p
  where (
    p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and p.id::text = p_actor_key
  ) or p.clerk_id = p_actor_key
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  v_count := coalesce(v_profile.display_name_change_count, 0);
  v_window := coalesce(v_profile.display_name_period_start, v_profile.created_at, v_now);

  if v_count >= 2 and v_now >= v_window + interval '14 days' then
    v_count := 0;
    v_next := null;
  elsif v_count >= 2 then
    v_next := v_window + interval '14 days';
  else
    v_next := null;
  end if;

  return jsonb_build_object(
    'ok', true,
    'display_name', v_profile.display_name,
    'changes_used', v_count,
    'changes_remaining', greatest(0, 2 - v_count),
    'next_allowed_at', v_next,
    'can_change', v_count < 2 or v_next is null
  );
end;
$$;

create or replace function public.change_display_name(p_actor_key text, p_new_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_display text;
  v_norm text;
  v_now timestamptz := now();
  v_window timestamptz;
  v_count int;
  v_next timestamptz;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_display := regexp_replace(trim(coalesce(p_new_name, '')), '\s+', ' ', 'g');

  if length(v_display) < 2 or length(v_display) > 24 then
    return jsonb_build_object('ok', false, 'error', 'invalid_length');
  end if;

  select * into v_profile
  from public.profiles p
  where (
    p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and p.id::text = p_actor_key
  ) or p.clerk_id = p_actor_key
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  v_norm := public.normalize_display_name(v_display);

  if v_norm = '' then
    return jsonb_build_object('ok', false, 'error', 'invalid_length');
  end if;

  if v_norm = coalesce(v_profile.display_name_normalized, public.normalize_display_name(v_profile.display_name)) then
    v_count := coalesce(v_profile.display_name_change_count, 0);
    v_window := coalesce(v_profile.display_name_period_start, v_profile.created_at, v_now);
    if v_count >= 2 and v_now >= v_window + interval '14 days' then
      v_count := 0;
    end if;
    return jsonb_build_object(
      'ok', true,
      'display_name', v_profile.display_name,
      'changes_remaining', greatest(0, 2 - v_count),
      'next_allowed_at', null
    );
  end if;

  v_count := coalesce(v_profile.display_name_change_count, 0);
  v_window := coalesce(v_profile.display_name_period_start, v_profile.created_at, v_now);

  if v_count >= 2 and v_now < v_window + interval '14 days' then
    return jsonb_build_object(
      'ok', false,
      'error', 'cooldown',
      'next_allowed_at', v_window + interval '14 days',
      'changes_used', v_count
    );
  end if;

  if v_count >= 2 and v_now >= v_window + interval '14 days' then
    v_count := 0;
    v_window := v_now;
  elsif v_profile.display_name_period_start is null then
    v_window := v_now;
  end if;

  if exists (
    select 1
    from public.profiles o
    where o.display_name_normalized = v_norm
      and o.id <> v_profile.id
  ) then
    return jsonb_build_object('ok', false, 'error', 'taken');
  end if;

  update public.profiles
  set
    display_name = v_display,
    display_name_normalized = v_norm,
    display_name_change_count = v_count + 1,
    display_name_period_start = v_window,
    display_name_last_changed_at = v_now
  where id = v_profile.id;

  v_next := null;
  if v_count + 1 >= 2 then
    v_next := v_window + interval '14 days';
  end if;

  return jsonb_build_object(
    'ok', true,
    'display_name', v_display,
    'changes_remaining', greatest(0, 2 - (v_count + 1)),
    'next_allowed_at', v_next
  );
end;
$$;

revoke all on function public.normalize_display_name(text) from public;
revoke all on function public.get_display_name_status(text) from public;
revoke all on function public.change_display_name(text, text) from public;

grant execute on function public.get_display_name_status(text) to anon, authenticated;
grant execute on function public.change_display_name(text, text) to anon, authenticated;

comment on function public.change_display_name is
  'Réserve un pseudo (unicité insensible à la casse) ; 2 changements max puis pause 14 jours.';
