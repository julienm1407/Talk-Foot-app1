-- Bridge Clerk <-> profiles (TalkFoot)
-- Objectif:
-- 1) stocker un identifiant Clerk non-UUID sans casser `profiles.id` (uuid historique)
-- 2) garder la compatibilité des données existantes

alter table public.profiles
  add column if not exists clerk_id text;

-- Backfill léger: sur les comptes historiques Supabase auth, clerk_id = id::text.
update public.profiles
set clerk_id = id::text
where clerk_id is null;

create unique index if not exists profiles_clerk_id_key on public.profiles (clerk_id);

-- Table dédiée sync Clerk (webhook / backend), indépendante de auth.users.
create table if not exists public.talkfoot_users (
  clerk_id text primary key,
  email text,
  username text unique,
  display_name text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_talkfoot_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talkfoot_users_set_updated_at on public.talkfoot_users;
create trigger talkfoot_users_set_updated_at
  before update on public.talkfoot_users
  for each row execute procedure public.set_talkfoot_users_updated_at();

