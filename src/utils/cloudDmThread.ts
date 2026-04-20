import {
  TALKFOOT_BOT_DM_THREAD_ID,
  parseFriendPeerIdFromThreadId,
} from '../data/directMessageConstants'

/** Clé stockée dans `private_messages.thread_key` pour le fil Coach (MP assistant). */
export function cloudCoachThreadKey(authUserId: string): string {
  return `coach:${authUserId}`
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(s: string): boolean {
  return UUID_RE.test(s)
}

/**
 * Clé `p2p:<uuid_min>:<uuid_max>` (lexicographique), alignée sur la migration Supabase.
 */
export function p2pThreadKey(userA: string, userB: string): string | null {
  if (!isUuid(userA) || !isUuid(userB)) return null
  const [low, high] = userA < userB ? [userA, userB] : [userB, userA]
  return `p2p:${low}:${high}`
}

/**
 * Retourne la clé cloud pour un fil MP affiché dans l’UI, ou null si tout reste local.
 * — Coach : `coach:<auth uid>`
 * — Ami : `p2p:...` si les deux IDs sont des UUID (session Supabase + pair).
 */
export function cloudPrivateThreadKey(uiThreadId: string, authUserId: string | undefined): string | null {
  if (!authUserId) return null
  if (uiThreadId === TALKFOOT_BOT_DM_THREAD_ID) return cloudCoachThreadKey(authUserId)
  const peerId = parseFriendPeerIdFromThreadId(uiThreadId)
  if (!peerId) return null
  return p2pThreadKey(authUserId, peerId)
}
