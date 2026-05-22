-- Interdit les liens / URLs dans les messages de chat (live, groupes, DM).

create or replace function public.talkfoot_text_contains_link(p_text text)
returns boolean
language plpgsql
immutable
as $$
declare
  norm text;
begin
  norm := lower(trim(coalesce(p_text, '')));
  if norm = '' or norm in ('[gif]', '[emote]') then
    return false;
  end if;

  norm := regexp_replace(norm, '\[\s*\.\s*\]', '.', 'g');
  norm := regexp_replace(norm, '\(\s*dot\s*\)', '.', 'gi');
  norm := regexp_replace(norm, '\s+dot\s+', '.', 'gi');
  norm := regexp_replace(norm, '\s+point\s+', '.', 'gi');
  norm := regexp_replace(norm, '\s+', '', 'g');

  if norm ~ '(^|[^a-z])https?://' then
    return true;
  end if;
  if norm ~ '(^|[^a-z])ftp://' then
    return true;
  end if;
  if norm ~ '(^|[^a-z])hxxps?://' then
    return true;
  end if;
  if norm ~ '(^|[^a-z/])www\.' then
    return true;
  end if;
  if norm ~ '[a-z0-9][-a-z0-9]{0,62}\.(com|fr|net|org|io|co|uk|de|es|it|be|ch|app|dev|link|me|tv|xyz|info|biz|eu|nl|pt|ca|us|gg|ly|to|sh|cc|ws)(/|:|[?#]|$)' then
    return true;
  end if;

  return false;
end;
$$;

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
    if public.talkfoot_text_contains_link(new.body) then
      raise exception 'content_moderation_rejected'
        using errcode = 'check_violation',
              hint = 'Liens et URLs interdits dans le chat.';
    end if;
  end if;
  return new;
end;
$$;

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
    if public.talkfoot_text_contains_link(new.body) then
      raise exception 'content_moderation_rejected'
        using errcode = 'check_violation',
              hint = 'Liens et URLs interdits dans le chat.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.talkfoot_moderate_private_message()
returns trigger
language plpgsql
as $$
begin
  if public.talkfoot_text_contains_banned(new.body) then
    raise exception 'content_moderation_rejected'
      using errcode = 'check_violation';
  end if;
  if public.talkfoot_text_contains_link(new.body) then
    raise exception 'content_moderation_rejected'
      using errcode = 'check_violation',
            hint = 'Liens et URLs interdits dans le chat.';
  end if;
  return new;
end;
$$;

comment on function public.talkfoot_text_contains_link is
  'Bloque http(s), www. et domaines courants dans les messages utilisateur.';
