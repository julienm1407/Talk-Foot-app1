import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureTalkFootSupabaseSession } from './talkfootSession'

function isUniqueViolation(err: { code?: string; message?: string; details?: string }): boolean {
  const c = err.code ?? ''
  const m = `${err.message ?? ''} ${err.details ?? ''}`
  return c === '23505' || /duplicate key|unique constraint|already exists/i.test(m)
}

export function isSubscriptionJoinLimitError(err: { message?: string; details?: string; hint?: string }): boolean {
  const m = `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`
  return /subscription_join_limit|max_groups_joined/i.test(m)
}

export function isSubscriptionCreateLimitError(err: { message?: string; details?: string; hint?: string }): boolean {
  const m = `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`
  return /subscription_create_limit|max_groups_created/i.test(m)
}

export async function upsertCloudGroupMembership(
  sb: SupabaseClient,
  groupId: string,
): Promise<{ ok: boolean; error?: string; code?: 'subscription_join_limit' }> {
  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session) return { ok: false, error: 'no_authenticated_session' }
  const { error } = await sb.from('supporter_group_members').insert({
    group_id: groupId,
    user_id: session.user.id,
  })
  if (!error) return { ok: true }
  if (isUniqueViolation(error)) return { ok: true }
  if (isSubscriptionJoinLimitError(error)) {
    return { ok: false, error: error.message, code: 'subscription_join_limit' }
  }
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
