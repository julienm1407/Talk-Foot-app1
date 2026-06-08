import { mergeUserAppState } from '../data/userAppStateDefaults'
import {
  resolveModularAvatarState,
  sanitizeModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'
import type { TalkfootProfileSnapshot } from '../lib/supabase/profileAppState'

/** Tenue telle que sauvegardée (aperçu public / chat) — sans réécriture « possession » locale. */
export function resolveProfileModularAvatarForDisplay(
  modular: ModularAvatarState | undefined | null,
): ModularAvatarState {
  return sanitizeModularAvatarState(resolveModularAvatarState(modular ?? undefined))
}

export function modularAvatarFromSnapshot(
  snapshot: TalkfootProfileSnapshot | null,
): ModularAvatarState | undefined {
  if (!snapshot) return undefined
  const merged = mergeUserAppState(snapshot.appState)
  const raw = merged.profile.modularAvatar
  if (!raw?.data) return undefined
  return resolveProfileModularAvatarForDisplay(raw)
}

/** Identifiants démo / bots : pas de lecture cloud pour la PP modulaire. */
export function shouldFetchCloudChatAvatar(userId: string, selfUserId: string): boolean {
  if (!userId || userId === selfUserId || userId === 'me') return false
  if (userId.startsWith('group-bot:') || userId.startsWith('u-')) return false
  if (userId === 'u-tf-bot') return false
  return true
}
