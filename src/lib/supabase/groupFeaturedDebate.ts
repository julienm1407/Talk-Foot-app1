import type { SupabaseClient } from '@supabase/supabase-js'

export async function fetchGroupFeaturedDebateId(
  sb: SupabaseClient,
  groupId: string,
): Promise<string | null> {
  const id = groupId.trim()
  if (!id) return null
  const { data, error } = await sb
    .from('group_featured_debate')
    .select('debate_id')
    .eq('group_id', id)
    .maybeSingle()
  if (error) {
    console.warn('[Talk Foot] fetch group_featured_debate:', error.message)
    return null
  }
  return typeof data?.debate_id === 'string' && data.debate_id.trim() ? data.debate_id.trim() : null
}

export async function adminSetGroupFeaturedDebate(
  sb: SupabaseClient,
  groupId: string,
  debateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc('admin_set_group_featured_debate', {
    p_group_id: groupId,
    p_debate_id: debateId,
  })
  if (error) {
    console.warn('[Talk Foot] admin_set_group_featured_debate:', error.message)
    return { ok: false, error: error.message }
  }
  const row = data as { ok?: boolean; error?: string } | null
  if (!row?.ok) return { ok: false, error: row?.error ?? 'link_failed' }
  return { ok: true }
}

export async function adminClearGroupFeaturedDebate(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc('admin_clear_group_featured_debate', {
    p_group_id: groupId,
  })
  if (error) {
    console.warn('[Talk Foot] admin_clear_group_featured_debate:', error.message)
    return { ok: false, error: error.message }
  }
  const row = data as { ok?: boolean; error?: string } | null
  if (!row?.ok) return { ok: false, error: row?.error ?? 'unlink_failed' }
  return { ok: true }
}
