-- Talk Foot — profils utilisateurs + journal d'activité
-- À exécuter dans le SQL Editor Supabase ou via CLI `supabase db push`
-- Idempotent : peut être relancé sans erreur « policy already exists ».

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  onboarding_complete boolean not null default false,
  app_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_id_created_at_idx
  on public.activity_events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "activity_insert_own" on public.activity_events;
create policy "activity_insert_own"
  on public.activity_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "activity_select_own" on public.activity_events;
create policy "activity_select_own"
  on public.activity_events for select
  using (auth.uid() = user_id);

create or replace function public.handle_talkfoot_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, onboarding_complete, app_state)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    false,
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_talkfoot_auth_user_created on auth.users;
create trigger on_talkfoot_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_talkfoot_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_profiles_updated_at();
