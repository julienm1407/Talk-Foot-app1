-- Réactions décoratives du live (fumigène, confettis, etc.) — visibles par tous sur le même match.

create table if not exists public.live_match_reactions (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('flare', 'confetti', 'goal', 'rage')),
  created_at timestamptz not null default now()
);

create index if not exists live_match_reactions_match_created_idx
  on public.live_match_reactions (match_id, created_at desc);

alter table public.live_match_reactions enable row level security;

drop policy if exists "live_match_reactions_select" on public.live_match_reactions;
create policy "live_match_reactions_select"
  on public.live_match_reactions for select
  to authenticated
  using (true);

drop policy if exists "live_match_reactions_insert_own" on public.live_match_reactions;
create policy "live_match_reactions_insert_own"
  on public.live_match_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_match_reactions'
  ) then
    alter publication supabase_realtime add table public.live_match_reactions;
  end if;
end$$;
