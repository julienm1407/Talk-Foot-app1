import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupporterChannel, SupporterGroup } from '../../types/group'

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
  channels: SupporterChannel[] | null
  owner_id: string
  owner_clerk_id: string | null
  created_at: string
}

export type CloudGroupViewer = {
  supabaseUserId?: string | null
  clerkUserId?: string | null
}

function parseChannels(raw: unknown): SupporterChannel[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (c): c is SupporterChannel =>
      c != null &&
      typeof c === 'object' &&
      typeof (c as SupporterChannel).id === 'string' &&
      typeof (c as SupporterChannel).name === 'string',
  )
}

function rowToGroup(row: GroupRow, viewer?: CloudGroupViewer): SupporterGroup {
  const isMine =
    (viewer?.supabaseUserId != null && row.owner_id === viewer.supabaseUserId) ||
    (viewer?.clerkUserId != null &&
      row.owner_clerk_id != null &&
      row.owner_clerk_id === viewer.clerkUserId)
  const channels = parseChannels(row.channels)
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji || '⚽',
    motto: row.motto || '',
    location: row.location ?? undefined,
    theme: row.theme ?? { primary: '#0ea5e9', secondary: '#0369a1', background: 'clean' },
    members: 1,
    intensity: 50,
    channels: channels.length ? channels : [],
    createdBy: isMine ? 'me' : 'system',
    createdAt: row.created_at,
    groupKind: (row.group_kind as SupporterGroup['groupKind']) ?? 'public',
    hashtags: row.hashtags?.length ? row.hashtags : undefined,
    fanTags: row.fan_tags ?? undefined,
    onlineNow: 1,
    messagesToday: 0,
    lastMessagePreview: 'Nouveau groupe — dis bonjour !',
  }
}

export async function fetchCloudSupporterGroups(
  sb: SupabaseClient,
  viewer?: CloudGroupViewer,
): Promise<SupporterGroup[]> {
  const { data, error } = await sb
    .from('supporter_groups')
    .select(
      'id,name,emoji,motto,location,group_kind,hashtags,fan_tags,theme,channels,owner_id,owner_clerk_id,created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) {
    console.error('[Talk Foot] fetch supporter_groups:', error.message)
    return []
  }
  if (!data?.length) return []
  return data.map((row) => rowToGroup(row as GroupRow, viewer))
}

export async function upsertCloudSupporterGroup(
  sb: SupabaseClient,
  group: SupporterGroup,
  ownerSupabaseId: string,
  ownerClerkId?: string | null,
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
      channels: group.channels ?? [],
      owner_id: ownerSupabaseId,
      owner_clerk_id: ownerClerkId ?? null,
      created_at: group.createdAt,
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.error('[Talk Foot] upsert supporter_groups:', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
