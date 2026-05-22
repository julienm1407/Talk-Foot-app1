-- Pseudo : éviter les faux positifs (ex. « Pedro » bloqué par « pd » en sous-chaîne).

create or replace function public.talkfoot_term_matches_banned(p_norm text, p_term text)
returns boolean
language plpgsql
immutable
as $$
declare
  escaped text;
begin
  if p_norm is null or p_norm = '' or p_term is null or trim(p_term) = '' then
    return false;
  end if;
  if position(' ' in p_term) > 0 then
    return position(p_term in p_norm) > 0;
  end if;
  escaped := regexp_replace(p_term, '([.*+?^${}()|[\]\\])', '\\\1', 'g');
  return p_norm ~ ('(^|[^a-z0-9])' || escaped || '([^a-z0-9]|$)');
end;
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
    if public.talkfoot_term_matches_banned(norm, term) then
      return true;
    end if;
  end loop;
  return false;
end;
$$;
