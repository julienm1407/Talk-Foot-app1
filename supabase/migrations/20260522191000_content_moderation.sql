-- Modération serveur (miroir liste client) : bloque insultes / haine à l’insertion.

create or replace function public.talkfoot_normalize_moderation_text(p_text text)
returns text
language sql
immutable
as $$
  select lower(
    regexp_replace(
      translate(
        trim(coalesce(p_text, '')),
        'àáâãäåèéêëìíîïòóôõöùúûüýÿçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÇÑ',
        'aaaaaaeeeeiiiioooooouuuuyycnAAAAAAEEEEIIIIOOOOOOUUUUYYC N'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.talkfoot_text_contains_banned(p_text text)
returns boolean
language plpgsql
immutable
as $$
declare
  norm text;
  term text;
  terms text[] := array[
    'putain','putes','pute','merde','connard','connasse','salaud','salope',
    'encule','enculer','nique','niquer','fdp','pd','tg','tagueule','fils de pute',
    'ta gueule','bordel','batard','bite','couille','couilles','chier','chiasse',
    'foutre','branleur','branle','suce','sucer','ntm','nique ta','niquer ta',
    'va te faire','va niquer','petasse','grognasse','tafiole','pedale','tapette',
    'tarlouze','bouffon','gogole','ducon','conne','enfoire','creve','degage',
    'trou du cul','va crever','negre','bicot','bougnoule','youpin','sale juif',
    'sale arabe','sale noir','sale blanc','raton','rebeu','renoi','monkey',
    'nazi','hitler','heil','kkk','islamogauch'
  ];
begin
  norm := public.talkfoot_normalize_moderation_text(p_text);
  if norm = '' then
    return false;
  end if;
  foreach term in array terms loop
    if position(term in norm) > 0 then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

-- Pseudo (RPC existante)
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

-- Débats publiés
create or replace function public.talkfoot_moderate_debates_row()
returns trigger
language plpgsql
as $$
begin
  if public.talkfoot_text_contains_banned(new.title)
     or public.talkfoot_text_contains_banned(new.excerpt) then
    raise exception 'content_moderation_rejected'
      using errcode = 'check_violation',
            hint = 'Insultes, vulgarité ou propos haineux interdits.';
  end if;
  return new;
end;
$$;

drop trigger if exists debates_moderation_before_write on public.debates;
create trigger debates_moderation_before_write
  before insert or update of title, excerpt on public.debates
  for each row execute function public.talkfoot_moderate_debates_row();

-- Messages salon live
create or replace function public.talkfoot_moderate_live_match_message()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.body, '') not in ('[GIF]', '[Emote]') then
    if public.talkfoot_text_contains_banned(new.body)
       or public.talkfoot_text_contains_banned(new.display_name) then
      raise exception 'content_moderation_rejected'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists live_match_messages_moderation on public.live_match_messages;
create trigger live_match_messages_moderation
  before insert on public.live_match_messages
  for each row execute function public.talkfoot_moderate_live_match_message();

-- Messages groupes
create or replace function public.talkfoot_moderate_group_channel_message()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.body, '') not in ('[GIF]', '[Emote]') then
    if public.talkfoot_text_contains_banned(new.body)
       or public.talkfoot_text_contains_banned(new.display_name) then
      raise exception 'content_moderation_rejected'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists supporter_group_channel_messages_moderation on public.supporter_group_channel_messages;
create trigger supporter_group_channel_messages_moderation
  before insert on public.supporter_group_channel_messages
  for each row execute function public.talkfoot_moderate_group_channel_message();

-- Messages privés
create or replace function public.talkfoot_moderate_private_message()
returns trigger
language plpgsql
as $$
begin
  if public.talkfoot_text_contains_banned(new.body) then
    raise exception 'content_moderation_rejected'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists private_messages_moderation on public.private_messages;
create trigger private_messages_moderation
  before insert on public.private_messages
  for each row execute function public.talkfoot_moderate_private_message();

comment on function public.talkfoot_text_contains_banned is
  'Filtre mots interdits (liste alignée app Talk Foot) pour conformité UGC.';
