-- Première connexion Google / Apple : formulaire pseudo + infos avant l’app.
-- Les comptes existants restent exemptés (colonne à true).

alter table public.profiles
  add column if not exists oauth_profile_completed boolean;

update public.profiles
set oauth_profile_completed = true
where oauth_profile_completed is null;

alter table public.profiles
  alter column oauth_profile_completed set not null,
  alter column oauth_profile_completed set default false;

create or replace function public.handle_talkfoot_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prov text;
begin
  prov := coalesce(new.raw_app_meta_data->>'provider', '');
  insert into public.profiles (id, display_name, onboarding_complete, app_state, oauth_profile_completed)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1),
      'Supporteur'
    ),
    false,
    '{}'::jsonb,
    case when prov in ('google', 'apple', 'github', 'facebook', 'discord') then false else true end
  );
  return new;
end;
$$;
