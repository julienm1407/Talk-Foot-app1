import { TALKFOOT_BOT_DM_THREAD_ID } from '../data/directMessagesMock'

/** Clé stockée dans `private_messages.thread_key` pour le fil Coach (MP assistant). */
export function cloudCoachThreadKey(authUserId: string): string {
  return `coach:${authUserId}`
}

/**
 * Retourne la clé cloud pour un fil MP affiché dans l’UI, ou null si tout reste local.
 * Aujourd’hui : uniquement le fil Coach quand l’utilisateur a une session Supabase (UUID).
 */
export function cloudPrivateThreadKey(uiThreadId: string, authUserId: string | undefined): string | null {
  if (!authUserId) return null
  if (uiThreadId === TALKFOOT_BOT_DM_THREAD_ID) return cloudCoachThreadKey(authUserId)
  return null
}
