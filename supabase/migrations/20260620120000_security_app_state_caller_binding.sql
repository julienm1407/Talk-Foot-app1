-- P0 sécurité : liaison session Supabase ↔ actor_key, merge app_state côté serveur,
-- blocage des écritures directes sur profiles.app_state, suppression compte RGPD.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.talkfoot_is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

create or replace function public.talkfoot_actor_key_is_uuid(p_actor_key text)
returns boolean
language sql
immutable
as $$
  select p_actor_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
$$;

-- Liaison device Supabase (auth.uid()) ↔ identifiant Talk Foot (Clerk ou UUID profil).
create table if not exists public.talkfoot_actor_sessions (
  supabase_user_id uuid primary key references auth.users (id) on delete cascade,
  actor_key text not null,
  bound_at timestamptz not null default now()
);

create index if not exists talkfoot_actor_sessions_actor_key_idx
  on public.talkfoot_actor_sessions (actor_key);

alter table public.talkfoot_actor_sessions enable row level security;

comment on table public.talkfoot_actor_sessions is
  'Liaison vérifiée (API Clerk) entre session Supabase anonyme/OAuth et actor_key Talk Foot.';

create or replace function public.talkfoot_assert_actor_caller(p_actor_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(p_actor_key), '');
begin
  if v_key is null then
    raise exception 'invalid_actor' using errcode = '22023';
  end if;

  if public.talkfoot_is_service_role() then
    return;
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- Compte Supabase Auth natif : actor_key = auth.uid().
  if public.talkfoot_actor_key_is_uuid(v_key) and v_key::uuid = auth.uid() then
    return;
  end if;

  -- Profil lié à auth.users avec clerk_id ou id correspondant.
  if exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.id::text = v_key or p.clerk_id = v_key)
  ) then
    return;
  end if;

  -- Session Clerk liée via API bind-talkfoot-actor (service role).
  if exists (
    select 1
    from public.talkfoot_actor_sessions s
    where s.supabase_user_id = auth.uid()
      and s.actor_key = v_key
  ) then
    return;
  end if;

  raise exception 'forbidden_actor' using errcode = '42501';
end;
$$;

revoke all on function public.talkfoot_assert_actor_caller(text) from public;

-- Fusion app_state client : préserve subscription, médailles, fulfillment Stripe, bonus quotidien.
create or replace function public.talkfoot_merge_client_app_state(
  p_existing jsonb,
  p_incoming jsonb
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_existing jsonb := coalesce(p_existing, '{}'::jsonb);
  v_incoming jsonb := coalesce(p_incoming, '{}'::jsonb);
  v_result jsonb := v_incoming;
  v_existing_wallet jsonb := coalesce(v_existing -> 'wallet', '{}'::jsonb);
  v_incoming_wallet jsonb := coalesce(v_incoming -> 'wallet', '{}'::jsonb);
  v_merged_wallet jsonb;
begin
  v_merged_wallet := v_incoming_wallet || jsonb_build_object(
    'medals', coalesce(v_existing_wallet -> 'medals', v_incoming_wallet -> 'medals', '0'::jsonb)
  );

  if v_existing_wallet ? 'lastDailyTokenGrant' then
    v_merged_wallet := v_merged_wallet || jsonb_build_object(
      'lastDailyTokenGrant', v_existing_wallet -> 'lastDailyTokenGrant'
    );
  end if;

  v_result := v_result
    || jsonb_build_object(
      'subscription', coalesce(v_existing -> 'subscription', v_incoming -> 'subscription', '{}'::jsonb),
      'stripeFulfillmentBySessionId', coalesce(
        v_existing -> 'stripeFulfillmentBySessionId',
        v_incoming -> 'stripeFulfillmentBySessionId',
        '{}'::jsonb
      ),
      'adminWalletBootstrapped', coalesce(
        v_existing -> 'adminWalletBootstrapped',
        v_incoming -> 'adminWalletBootstrapped'
      )
    );

  v_result := jsonb_set(v_result, '{wallet}', v_merged_wallet, true);
  return v_result;
end;
$$;

revoke all on function public.talkfoot_merge_client_app_state(jsonb, jsonb) from public;

-- Bloque UPDATE direct sur profiles.app_state (contournement RLS / fallback client).
create or replace function public.profiles_guard_app_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('talkfoot.allow_app_state_write', true) = '1' then
    return new;
  end if;

  if new.app_state is distinct from old.app_state then
    raise exception 'app_state_direct_update_forbidden' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_app_state on public.profiles;
create trigger profiles_guard_app_state
  before update on public.profiles
  for each row execute procedure public.profiles_guard_app_state();

-- Corrige admin check (profiles.email n''existe pas).
create or replace function public.talkfoot_is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    join public.admin_users au on lower(au.email) = lower(u.email)
    where p.id = p_user_id
  )
  or exists (
    select 1
    from public.profiles p
    join public.talkfoot_users tu on tu.clerk_id = p.clerk_id
    join public.admin_users au on lower(au.email) = lower(tu.email)
    where p.id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC profil durcies
-- ---------------------------------------------------------------------------

create or replace function public.get_talkfoot_user_snapshot(p_actor_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  perform public.talkfoot_assert_actor_caller(p_actor_key);

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_profile.id,
    'display_name', v_profile.display_name,
    'onboarding_complete', v_profile.onboarding_complete,
    'oauth_profile_completed', v_profile.oauth_profile_completed,
    'app_state', coalesce(v_profile.app_state, '{}'::jsonb)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(sqlerrm, 'forbidden')
    );
end;
$$;

create or replace function public.ensure_talkfoot_profile(
  p_actor_key text,
  p_display_name text default 'Supporter',
  p_oauth_profile_completed boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_is_uuid boolean;
  v_name text;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is not null then
    perform public.talkfoot_assert_actor_caller(p_actor_key);
    return jsonb_build_object(
      'ok', true,
      'created', false,
      'id', v_profile.id,
      'display_name', v_profile.display_name,
      'onboarding_complete', v_profile.onboarding_complete,
      'oauth_profile_completed', v_profile.oauth_profile_completed,
      'app_state', coalesce(v_profile.app_state, '{}'::jsonb)
    );
  end if;

  v_name := coalesce(nullif(trim(p_display_name), ''), 'Supporter');
  v_is_uuid := public.talkfoot_actor_key_is_uuid(p_actor_key);

  if v_is_uuid then
    insert into public.profiles (
      id,
      clerk_id,
      display_name,
      onboarding_complete,
      app_state,
      oauth_profile_completed
    )
    values (
      p_actor_key::uuid,
      p_actor_key,
      v_name,
      false,
      '{}'::jsonb,
      p_oauth_profile_completed
    )
    returning * into v_profile;
  else
    insert into public.profiles (
      clerk_id,
      display_name,
      onboarding_complete,
      app_state,
      oauth_profile_completed
    )
    values (
      p_actor_key,
      v_name,
      false,
      '{}'::jsonb,
      p_oauth_profile_completed
    )
    returning * into v_profile;
  end if;

  return jsonb_build_object(
    'ok', true,
    'created', true,
    'id', v_profile.id,
    'display_name', v_profile.display_name,
    'onboarding_complete', v_profile.onboarding_complete,
    'oauth_profile_completed', v_profile.oauth_profile_completed,
    'app_state', coalesce(v_profile.app_state, '{}'::jsonb)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(sqlerrm, 'forbidden')
    );
end;
$$;

create or replace function public.save_talkfoot_user_app_state(
  p_actor_key text,
  p_app_state jsonb,
  p_onboarding_complete boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_rows int;
  v_merged jsonb;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if p_app_state is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_app_state');
  end if;

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if public.talkfoot_is_service_role() then
    v_merged := p_app_state;
  else
    perform public.talkfoot_assert_actor_caller(p_actor_key);
    v_merged := public.talkfoot_merge_client_app_state(v_profile.app_state, p_app_state);
  end if;

  perform set_config('talkfoot.allow_app_state_write', '1', true);

  update public.profiles
  set
    app_state = v_merged,
    onboarding_complete = coalesce(p_onboarding_complete, onboarding_complete)
  where id = v_profile.id;

  get diagnostics v_rows = row_count;
  if v_rows < 1 then
    return jsonb_build_object('ok', false, 'error', 'update_failed');
  end if;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(sqlerrm, 'forbidden')
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC sensibles : vérification appelant
-- ---------------------------------------------------------------------------

create or replace function public.claim_daily_token_bonus(
  p_actor_key text,
  p_amount int default 35,
  p_bonus_hour int default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_now timestamptz;
  v_day text;
  v_wallet jsonb;
  v_tokens int;
  v_medals int;
  v_last text;
  v_new_wallet jsonb;
  v_new_app jsonb;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_actor');
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 500 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;

  perform public.talkfoot_assert_actor_caller(p_actor_key);

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'reason', 'profile_not_found');
  end if;

  v_now := timezone('Europe/Paris', now());
  v_day := to_char(v_now, 'YYYY-MM-DD');

  if extract(hour from v_now)::int < p_bonus_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'not_open_yet',
      'claim_day_key', v_day
    );
  end if;

  select * into v_profile
  from public.profiles p
  where p.id = v_profile.id
  for update;

  v_wallet := coalesce(v_profile.app_state -> 'wallet', '{}'::jsonb);
  v_last := nullif(trim(v_wallet ->> 'lastDailyTokenGrant'), '');

  if v_last = v_day then
    return jsonb_build_object(
      'ok', false,
      'reason', 'already_claimed',
      'claim_day_key', v_day,
      'wallet', v_wallet
    );
  end if;

  v_tokens := greatest(0, coalesce((v_wallet ->> 'tokens')::int, 100));
  v_medals := greatest(0, coalesce((v_wallet ->> 'medals')::int, 0));

  v_new_wallet := jsonb_build_object(
    'tokens', v_tokens + p_amount,
    'medals', v_medals,
    'lastDailyTokenGrant', v_day
  );

  v_new_app := jsonb_set(
    coalesce(v_profile.app_state, '{}'::jsonb),
    '{wallet}',
    v_new_wallet,
    true
  );

  perform set_config('talkfoot.allow_app_state_write', '1', true);

  update public.profiles
  set app_state = v_new_app
  where id = v_profile.id;

  return jsonb_build_object(
    'ok', true,
    'amount', p_amount,
    'claim_day_key', v_day,
    'wallet', v_new_wallet
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'reason', coalesce(sqlerrm, 'forbidden'));
end;
$$;

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

  perform public.talkfoot_assert_actor_caller(p_viewer_actor_key);

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
exception
  when others then
    return jsonb_build_object('ok', false, 'error', coalesce(sqlerrm, 'forbidden'));
end;
$$;

create or replace function public.change_display_name(p_actor_key text, p_new_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
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

  perform public.talkfoot_assert_actor_caller(p_actor_key);

  v_display := regexp_replace(trim(coalesce(p_new_name, '')), '\s+', ' ', 'g');

  if length(v_display) < 2 or length(v_display) > 24 then
    return jsonb_build_object('ok', false, 'error', 'invalid_length');
  end if;

  if public.talkfoot_text_contains_banned(v_display) then
    return jsonb_build_object('ok', false, 'error', 'banned');
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

  if v_norm = coalesce(
    nullif(trim(v_profile.display_name_normalized), ''),
    public.normalize_display_name(v_profile.display_name)
  ) then
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
    where coalesce(
      nullif(trim(o.display_name_normalized), ''),
      public.normalize_display_name(o.display_name)
    ) = v_norm
      and o.id <> v_profile.id
  ) then
    return jsonb_build_object('ok', false, 'error', 'taken');
  end if;

  if exists (
    select 1
    from auth.users u
    where public.resolve_auth_user_display_norm(u.raw_user_meta_data) = v_norm
      and u.id is distinct from v_profile.id
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
exception
  when others then
    return jsonb_build_object('ok', false, 'error', coalesce(sqlerrm, 'forbidden'));
end;
$$;

-- ---------------------------------------------------------------------------
-- Suppression compte (RGPD) — profil cloud + données associées
-- ---------------------------------------------------------------------------

create or replace function public.delete_my_talkfoot_account(p_actor_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.profiles%rowtype;
  v_chat_profile_id uuid;
begin
  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  perform public.talkfoot_assert_actor_caller(p_actor_key);

  v_profile := public.resolve_talkfoot_profile(p_actor_key);
  if v_profile.id is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  v_chat_profile_id := auth.uid();

  delete from public.friendships
  where user_low = v_profile.id or user_high = v_profile.id;

  if v_chat_profile_id is not null then
    delete from public.friendships
    where user_low = v_chat_profile_id or user_high = v_chat_profile_id;

    delete from public.supporter_group_members
    where user_id = v_chat_profile_id;

    delete from public.activity_events
    where user_id = v_chat_profile_id;
  end if;

  delete from public.talkfoot_actor_sessions
  where actor_key = trim(p_actor_key)
     or (v_chat_profile_id is not null and supabase_user_id = v_chat_profile_id);

  if v_profile.clerk_id is not null then
    delete from public.talkfoot_users where clerk_id = v_profile.clerk_id;
  end if;

  delete from public.profiles where id = v_profile.id;

  if v_chat_profile_id is not null and v_chat_profile_id <> v_profile.id then
    delete from public.profiles where id = v_chat_profile_id;
  end if;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', coalesce(sqlerrm, 'delete_failed'));
end;
$$;

revoke all on function public.delete_my_talkfoot_account(text) from public;
grant execute on function public.delete_my_talkfoot_account(text) to anon, authenticated;

comment on function public.talkfoot_assert_actor_caller is
  'Vérifie que auth.uid() ou une session liée correspond à p_actor_key (service_role exempté).';
comment on function public.talkfoot_merge_client_app_state is
  'Merge app_state client en préservant subscription, médailles, fulfillment Stripe et bonus quotidien.';
comment on function public.save_talkfoot_user_app_state is
  'Persiste app_state avec merge serveur ; service_role peut écrire sans merge (Stripe).';
comment on function public.delete_my_talkfoot_account is
  'Supprime le profil cloud Talk Foot et données associées pour l''appelant authentifié.';
