import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupporterGroup } from '../../types/group'

type GroupRow = {
  id: string
  name: string
  emoji: string
  motto: string
  location: string | null
  group_kind: string | null
  hashtags: string[] | null
  fan_tags: SupporterGroup['fanTags'] | null
  theme: SupporterGroup['theme'] | null
  owner_id: string
  created_at: string
}

function rowToGroup(row: GroupRow): SupporterGroup {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji || '⚽',
    motto: row.motto || '',
    location: row.location ?? undefined,
    theme: row.theme ?? { primary: '#0ea5e9', secondary: '#0369a1', background: 'clean' },
    members: 1,
    intensity: 50,
    channels: [],
    createdBy: 'me',
    createdAt: row.created_at,
    groupKind: (row.group_kind as SupporterGroup['groupKind']) ?? 'public',
    hashtags: row.hashtags?.length ? row.hashtags : undefined,
    fanTags: row.fan_tags ?? undefined,
    onlineNow: 1,
    messagesToday: 0,
    lastMessagePreview: 'Nouveau groupe — dis bonjour !',
  }
}

export async function fetchCloudSupporterGroups(sb: SupabaseClient): Promise<SupporterGroup[]> {
  const { data, error } = await sb
    .from('supporter_groups')
    .select('id,name,emoji,motto,location,group_kind,hashtags,fan_tags,theme,owner_id,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data?.length) return []
  return data.map((row) => rowToGroup(row as GroupRow))
}

export async function upsertCloudSupporterGroup(
  sb: SupabaseClient,
  group: SupporterGroup,
  ownerId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await sb.from('supporter_groups').upsert(
    {
      id: group.id,
      name: group.name,
      emoji: group.emoji,
      motto: group.motto,
      location: group.location ?? null,
      group_kind: group.groupKind ?? 'public',
      hashtags: group.hashtags ?? [],
      fan_tags: group.fanTags ?? null,
      theme: group.theme,
      owner_id: ownerId,
      created_at: group.createdAt,
    },
    { onConflict: 'id' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
