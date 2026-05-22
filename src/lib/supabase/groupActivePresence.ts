import type { SupabaseClient } from '@supabase/supabase-js'
import type { GroupActivePresence } from '../../types/group'

const ACCENTS: GroupActivePresence['accent'][] = ['violet', 'emerald', 'rose', 'amber']

function accentForUserId(userId: string): GroupActivePresence['accent'] {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h + userId.charCodeAt(i)) % ACCENTS.length
  return ACCENTS[h]!
}

function avatarSeedFromDisplayName(displayName: string, userId: string): string {
  const base = displayName.trim().replace(/\s+/g, '-').slice(0, 24)
  return base || userId.slice(0, 12) || 'supporter'
}

export async function fetchGroupActivePresence(
  sb: SupabaseClient,
  groupIds: string[],
  limitPerGroup = 4,
): Promise<Map<string, GroupActivePresence[]>> {
  const out = new Map<string, GroupActivePresence[]>()
  if (!groupIds.length) return out

  const { data, error } = await sb.rpc('get_group_active_presence', {
    p_group_ids: groupIds,
    p_limit_per_group: limitPerGroup,
  })
  if (error) {
    console.warn('[Talk Foot] get_group_active_presence:', error.message)
    return out
  }

  for (const row of data ?? []) {
    const gid = row?.group_id
    const userId = row?.user_id
    if (typeof gid !== 'string' || !gid || typeof userId !== 'string' || !userId) continue
    const displayName =
      typeof row.display_name === 'string' && row.display_name.trim()
        ? row.display_name.trim()
        : 'Supporter'
    const entry: GroupActivePresence = {
      userId,
      displayName,
      avatarSeed: avatarSeedFromDisplayName(displayName, userId),
      accent: accentForUserId(userId),
    }
    const list = out.get(gid) ?? []
    if (!list.some((p) => p.userId === userId)) list.push(entry)
    out.set(gid, list)
  }
  return out
}
