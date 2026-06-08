-- =============================================================================
-- PURGE UNIQUE — messages de test dans les tribunes (groupes supporters)
-- À exécuter dans Supabase → SQL Editor (rôle postgres / service).
-- =============================================================================
-- 1) Aperçu : tribunes et volume de messages
select
  m.group_id,
  coalesce(g.name, m.group_id) as tribune_name,
  count(*)::int as message_count,
  min(m.created_at) as oldest,
  max(m.created_at) as newest
from public.supporter_group_channel_messages m
left join public.supporter_groups g on g.id = m.group_id
group by m.group_id, g.name
order by message_count desc;

-- 2) OPTION A — une seule tribune (décommente et remplace l'id) :
-- delete from public.inbox_notifications
-- where group_id = 'TON_GROUP_ID'
--    or message_id in (
--      select id from public.supporter_group_channel_messages where group_id = 'TON_GROUP_ID'
--    );
-- delete from public.supporter_group_channel_messages where group_id = 'TON_GROUP_ID';

-- 3) OPTION B — toutes les tribunes (messages de test partout) :
begin;

delete from public.inbox_notifications
where kind = 'message_like'
   or message_id is not null
   or group_id is not null;

delete from public.supporter_group_channel_messages;

commit;

-- 4) Vérification
select count(*)::int as remaining_messages from public.supporter_group_channel_messages;
