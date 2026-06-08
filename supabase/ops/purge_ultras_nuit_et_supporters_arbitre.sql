-- =============================================================================
-- Vider les messages de test :
--   • Ultras de la Nuit      (g-ultras-nuit)
--   • Supporters d'arbitre   (recherche par nom)
--   • Tribune Rouge          (g-tribune-rouge)
-- Supabase → SQL Editor → exécuter en entier (rôle postgres).
-- =============================================================================

-- 1) Vérifier les tribunes ciblées
select id, name, group_kind, created_at
from public.supporter_groups
where id in ('g-ultras-nuit', 'g-tribune-rouge')
   or lower(trim(name)) in (
     lower('Ultras de la Nuit'),
     lower('Tribune Rouge'),
     lower('Supporters d''arbitre'),
     lower('Supporter d''arbitre')
   )
   or lower(name) like '%supporters%arbitre%'
order by name;

-- 2) Aperçu du volume de messages par salon
select
  m.group_id,
  g.name as tribune_name,
  m.channel_id,
  count(*)::int as message_count
from public.supporter_group_channel_messages m
left join public.supporter_groups g on g.id = m.group_id
where m.group_id in ('g-ultras-nuit', 'g-tribune-rouge')
   or m.group_id in (
     select sg.id
     from public.supporter_groups sg
     where lower(sg.name) like '%supporters%arbitre%'
   )
group by m.group_id, g.name, m.channel_id
order by tribune_name, m.channel_id;

-- 3) Purge (likes supprimés en cascade sur message_id)
begin;

with target_groups as (
  select unnest(array[
    'g-ultras-nuit'::text,
    'g-tribune-rouge'::text
  ]) as group_id
  union
  select sg.id
  from public.supporter_groups sg
  where lower(trim(sg.name)) like '%supporters%arbitre%'
)
delete from public.inbox_notifications n
where n.group_id in (select group_id from target_groups)
   or n.message_id in (
     select m.id
     from public.supporter_group_channel_messages m
     where m.group_id in (select group_id from target_groups)
   );

with target_groups as (
  select unnest(array[
    'g-ultras-nuit'::text,
    'g-tribune-rouge'::text
  ]) as group_id
  union
  select sg.id
  from public.supporter_groups sg
  where lower(trim(sg.name)) like '%supporters%arbitre%'
)
delete from public.supporter_group_channel_messages m
where m.group_id in (select group_id from target_groups);

commit;

-- 4) Contrôle
select
  g.id,
  g.name,
  count(m.id)::int as remaining_messages
from public.supporter_groups g
left join public.supporter_group_channel_messages m on m.group_id = g.id
where g.id in ('g-ultras-nuit', 'g-tribune-rouge')
   or lower(trim(g.name)) like '%supporters%arbitre%'
group by g.id, g.name
order by g.name;
