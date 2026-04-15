import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureSupabaseAuthenticatedSession } from './ensureSession'

export async function upsertCloudGroupMembership(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await ensureSupabaseAuthenticatedSession(sb)
  if (!session) return { ok: false, error: 'no_authenticated_session' }
  const { error } = await sb.from('supporter_group_members').upsert(
    { group_id: groupId, user_id: session.user.id },
    { onConflict: 'group_id,user_id' },
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteCloudGroupMembership(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await ensureSupabaseAuthenticatedSession(sb)
  if (!session) return { ok: false, error: 'no_authenticated_session' }
  const { error } = await sb
    .from('supporter_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', session.user.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
