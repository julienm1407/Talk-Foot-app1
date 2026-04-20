import { talkFootBotUser } from './users'

/** Fil MP avec l’assistant (même id d’UI que dans directMessagesMock). */
export const TALKFOOT_BOT_DM_THREAD_ID = `dm-${talkFootBotUser.id}`

export const FRIEND_DM_PREFIX = 'dm-friend-'

export function friendDmThreadId(peerUserId: string): string {
  return `${FRIEND_DM_PREFIX}${peerUserId}`
}

export function parseFriendPeerIdFromThreadId(threadId: string): string | null {
  if (!threadId.startsWith(FRIEND_DM_PREFIX)) return null
  const rest = threadId.slice(FRIEND_DM_PREFIX.length)
  return rest || null
}
