import type { SupabaseClient } from '@supabase/supabase-js'

type RpcResult = { ok?: boolean; error?: string }

export async function fetchAdminRemovedGroupIds(sb: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await sb.from('admin_removed_groups').select('group_id')
  if (error) {
    console.warn('[Talk Foot] fetch admin_removed_groups:', error.message)
    return new Set()
  }
  return new Set(
    (data ?? [])
      .map((row) => (typeof row.group_id === 'string' ? row.group_id.trim() : ''))
      .filter(Boolean),
  )
}

export async function fetchAdminRemovedDebateIds(sb: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await sb.from('admin_removed_debates').select('debate_id')
  if (error) {
    console.warn('[Talk Foot] fetch admin_removed_debates:', error.message)
    return new Set()
  }
  return new Set(
    (data ?? [])
      .map((row) => (typeof row.debate_id === 'string' ? row.debate_id.trim() : ''))
      .filter(Boolean),
  )
}

export async function adminDeleteGroup(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc('admin_delete_group', { p_group_id: groupId })
  if (error) {
    console.warn('[Talk Foot] admin_delete_group:', error.message)
    return { ok: false, error: error.message }
  }
  const row = data as RpcResult | null
  if (!row?.ok) return { ok: false, error: row?.error ?? 'delete_failed' }
  return { ok: true }
}

export async function adminDeleteDebate(
  sb: SupabaseClient,
  debateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc('admin_delete_debate', { p_debate_id: debateId })
  if (error) {
    console.warn('[Talk Foot] admin_delete_debate:', error.message)
    return { ok: false, error: error.message }
  }
  const row = data as RpcResult | null
  if (!row?.ok) return { ok: false, error: row?.error ?? 'delete_failed' }
  return { ok: true }
}
