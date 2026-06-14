import type { SupabaseClient } from '@supabase/supabase-js'
import { isClerkAuthMode } from './talkfootSession'

export type BindTalkfootActorResult = { ok: true } | { ok: false; error: string }

let lastSuccessfulBindKey: string | null = null
let lastSupabaseUserId: string | null = null

/**
 * Lie la session Supabase courante (auth.uid()) à l'actor_key Talk Foot (Clerk).
 * No-op pour les comptes Supabase Auth natifs (UUID = actor_key).
 */
export async function bindTalkfootActorSession(
  sb: SupabaseClient,
  actorKey: string,
  clerkSessionId: string | null | undefined,
): Promise<BindTalkfootActorResult> {
  if (!isClerkAuthMode()) return { ok: true }

  const key = actorKey.trim()
  const sessionId = clerkSessionId?.trim()
  if (!key || !sessionId) {
    return { ok: false, error: 'missing_clerk_session' }
  }

  const { data: sessionWrap } = await sb.auth.getSession()
  const accessToken = sessionWrap.session?.access_token
  const supabaseUserId = sessionWrap.session?.user?.id?.trim() ?? ''
  if (!accessToken || !supabaseUserId) {
    return { ok: false, error: 'no_supabase_session' }
  }

  const bindKey = `${key}:${sessionId}:${supabaseUserId}`
  if (lastSupabaseUserId !== supabaseUserId) {
    lastSuccessfulBindKey = null
    lastSupabaseUserId = supabaseUserId
  }
  if (lastSuccessfulBindKey === bindKey) {
    return { ok: true }
  }

  const res = await fetch('/api/bind-talkfoot-actor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actorKey: key,
      clerkSessionId: sessionId,
      supabaseAccessToken: accessToken,
    }),
  })

  let payload: { ok?: boolean; error?: string } = {}
  try {
    payload = (await res.json()) as typeof payload
  } catch {
    payload = {}
  }

  if (!res.ok || payload.ok !== true) {
    return { ok: false, error: payload.error ?? `bind_http_${res.status}` }
  }

  lastSuccessfulBindKey = bindKey
  return { ok: true }
}

export async function deleteMyTalkfootAccount(
  sb: SupabaseClient,
  actorKey: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await sb.rpc('delete_my_talkfoot_account', { p_actor_key: actorKey })
  if (error) return { ok: false, error: error.message }
  if (!data || data.ok !== true) {
    return { ok: false, error: String(data?.error ?? 'delete_failed') }
  }
  return { ok: true }
}
