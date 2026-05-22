-- Débats catalogue + agrégats messages (participants / volume réels).

create table if not exists public.debates (
  id text primary key,
  group_id text not null,
  title text not null,
  excerpt text not null default '',
  accent text not null default '#6366f1',
  salon_access text not null default 'public'
    check (salon_access in ('public', 'members')),
  hero_image_url text,
  trending boolean not null default false,
  /** 1 = débat du jour affiché sur l’accueil */
  featured_rank smallint,
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists debates_group_id_idx on public.debates (group_id);
create index if not exists debates_status_published_idx on public.debates (status)
  where status = 'published';
create index if not exists debates_featured_rank_idx on public.debates (featured_rank)
  where featured_rank is not null;

alter table public.debates enable row level security;

drop policy if exists "debates_select_published" on public.debates;
create policy "debates_select_published"
  on public.debates for select
  using (status = 'published');

drop policy if exists "debates_insert_authenticated" on public.debates;
create policy "debates_insert_authenticated"
  on public.debates for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and status = 'published'
  );

drop policy if exists "debates_service_role_all" on public.debates;
create policy "debates_service_role_all"
  on public.debates for all
  to service_role
  using (true)
  with check (true);

create or replace view public.debates_with_stats as
select
  d.id,
  d.group_id,
  d.title,
  d.excerpt,
  d.accent,
  d.salon_access,
  d.hero_image_url,
  d.trending,
  d.featured_rank,
  d.status,
  d.created_at,
  coalesce(s.messages_count, 0)::int as messages_count,
  coalesce(s.participants_count, 0)::int as participants_count,
  coalesce(s.messages_24h, 0)::int as messages_24h
from public.debates d
left join (
  select
    nullif(trim(metadata->>'debate_id'), '') as debate_id,
    count(*)::int as messages_count,
    count(distinct user_id)::int as participants_count,
    count(*) filter (where created_at > now() - interval '24 hours')::int as messages_24h
  from public.supporter_group_channel_messages
  where channel_id = 'general'
    and metadata ? 'debate_id'
    and nullif(trim(metadata->>'debate_id'), '') is not null
  group by nullif(trim(metadata->>'debate_id'), '')
) s on s.debate_id = d.id
where d.status = 'published';

grant select on public.debates_with_stats to anon, authenticated;

comment on view public.debates_with_stats is
  'Débats publiés avec messages_count / participants_count agrégés depuis supporter_group_channel_messages.';
