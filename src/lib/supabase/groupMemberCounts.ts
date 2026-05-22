import type { SupabaseClient } from '@supabase/supabase-js'

export async function fetchSupporterGroupMemberCounts(
  sb: SupabaseClient,
  groupIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!groupIds.length) return out

  const { data, error } = await sb.rpc('get_group_member_counts', {
    p_group_ids: groupIds,
  })
  if (error) {
    console.warn('[Talk Foot] get_group_member_counts:', error.message)
    return out
  }
  for (const row of data ?? []) {
    const gid = row?.group_id
    if (typeof gid !== 'string' || !gid) continue
    out.set(gid, Number(row.member_count) || 0)
  }
  return out
}
