-- Sondages tribune (un à la fois) + messages officiels Talk Foot.

create table if not exists public.tribune_polls (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  question text not null,
  options jsonb not null,
  kind text not null,
  trigger_key text not null,
  created_at timestamptz not null default now(),
  unique (match_id, trigger_key)
);

create index if not exists tribune_polls_match_created_idx
  on public.tribune_polls (match_id, created_at desc);

create table if not exists public.tribune_poll_votes (
  poll_id uuid not null references public.tribune_polls (id) on delete cascade,
  voter_key text not null,
  option_id text not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, voter_key)
);

create table if not exists public.tribune_official_posts (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  body text not null,
  minute integer,
  trigger_key text,
  created_at timestamptz not null default now()
);

create index if not exists tribune_official_posts_match_idx
  on public.tribune_official_posts (match_id, created_at);
create unique index if not exists tribune_official_posts_match_trigger_uidx
  on public.tribune_official_posts (match_id, trigger_key)
  where trigger_key is not null;

alter table public.tribune_polls enable row level security;
alter table public.tribune_poll_votes enable row level security;
alter table public.tribune_official_posts enable row level security;

drop policy if exists tribune_polls_select_public on public.tribune_polls;
create policy tribune_polls_select_public
  on public.tribune_polls for select to anon, authenticated using (true);

drop policy if exists tribune_poll_votes_select_public on public.tribune_poll_votes;
create policy tribune_poll_votes_select_public
  on public.tribune_poll_votes for select to anon, authenticated using (true);

drop policy if exists tribune_official_posts_select_public on public.tribune_official_posts;
create policy tribune_official_posts_select_public
  on public.tribune_official_posts for select to anon, authenticated using (true);

grant select on public.tribune_polls to anon, authenticated;
grant select on public.tribune_poll_votes to anon, authenticated;
grant select on public.tribune_official_posts to anon, authenticated;

create or replace function public.ensure_tribune_poll(
  p_match_id text,
  p_question text,
  p_options jsonb,
  p_kind text,
  p_trigger_key text,
  p_official_body text default null,
  p_minute integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_match_id is null or length(trim(p_match_id)) = 0 then
    raise exception 'match_id required';
  end if;
  insert into public.tribune_polls (match_id, question, options, kind, trigger_key)
  values (trim(p_match_id), p_question, coalesce(p_options, '[]'::jsonb), p_kind, p_trigger_key)
  on conflict (match_id, trigger_key) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.tribune_polls
    where match_id = trim(p_match_id) and trigger_key = p_trigger_key;
    return v_id;
  end if;
  if p_official_body is not null and length(trim(p_official_body)) > 0 then
    insert into public.tribune_official_posts (match_id, body, minute, trigger_key)
    values (trim(p_match_id), trim(p_official_body), p_minute, 'poll:' || p_trigger_key)
    on conflict do nothing;
  end if;
  return v_id;
end;
$$;

create or replace function public.vote_tribune_poll(
  p_poll_id uuid,
  p_option_id text,
  p_voter_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_poll_id is null or p_option_id is null or p_voter_key is null or length(trim(p_voter_key)) = 0 then
    raise exception 'vote args required';
  end if;
  insert into public.tribune_poll_votes (poll_id, voter_key, option_id)
  values (p_poll_id, trim(p_voter_key), trim(p_option_id))
  on conflict (poll_id, voter_key) do update set option_id = excluded.option_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.post_tribune_official(
  p_match_id text,
  p_body text,
  p_minute integer default null,
  p_trigger_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.tribune_official_posts (match_id, body, minute, trigger_key)
  values (trim(p_match_id), trim(p_body), p_minute, p_trigger_key)
  on conflict do nothing
  returning id into v_id;
  if v_id is null and p_trigger_key is not null then
    select id into v_id from public.tribune_official_posts
    where match_id = trim(p_match_id) and trigger_key = p_trigger_key;
  end if;
  return v_id;
end;
$$;

grant execute on function public.ensure_tribune_poll(text, text, jsonb, text, text, text, integer) to anon, authenticated;
grant execute on function public.vote_tribune_poll(uuid, text, text) to authenticated;
grant execute on function public.post_tribune_official(text, text, integer, text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tribune_polls'
  ) then
    alter publication supabase_realtime add table public.tribune_polls;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tribune_poll_votes'
  ) then
    alter publication supabase_realtime add table public.tribune_poll_votes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tribune_official_posts'
  ) then
    alter publication supabase_realtime add table public.tribune_official_posts;
  end if;
end$$;
