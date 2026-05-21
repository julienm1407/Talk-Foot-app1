import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureTalkFootSupabaseSession } from './talkfootSession'

function isUniqueViolation(err: { code?: string; message?: string; details?: string }): boolean {
  const c = err.code ?? ''
  const m = `${err.message ?? ''} ${err.details ?? ''}`
  return c === '23505' || /duplicate key|unique constraint|already exists/i.test(m)
}

export async function upsertCloudGroupMembership(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session) return { ok: false, error: 'no_authenticated_session' }
  const { error } = await sb.from('supporter_group_members').insert({
    group_id: groupId,
    user_id: session.user.id,
  })
  if (!error) return { ok: true }
  if (isUniqueViolation(error)) return { ok: true }
  return { ok: false, error: error.message }
}

export async function deleteCloudGroupMembership(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session) return { ok: false, error: 'no_authenticated_session' }
  const { error } = await sb
    .from('supporter_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', session.user.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
