import type { SupabaseClient } from '@supabase/supabase-js'

export type GroupActivityStats = {
  messagesToday: number
  onlineNow: number
}

export async function fetchGroupActivityStats(
  sb: SupabaseClient,
  groupIds: string[],
): Promise<Map<string, GroupActivityStats>> {
  const out = new Map<string, GroupActivityStats>()
  if (!groupIds.length) return out

  const { data, error } = await sb.rpc('get_group_activity_stats', {
    p_group_ids: groupIds,
  })
  if (error) {
    console.warn('[Talk Foot] get_group_activity_stats:', error.message)
    return out
  }
  for (const row of data ?? []) {
    const gid = row?.group_id
    if (typeof gid !== 'string' || !gid) continue
    out.set(gid, {
      messagesToday: Number(row.messages_today) || 0,
      onlineNow: Number(row.online_now) || 0,
    })
  }
  return out
}
