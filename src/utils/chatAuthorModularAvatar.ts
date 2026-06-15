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

export function modularAvatarFromPublicRow(modular: unknown): ModularAvatarState | undefined {
  if (!modular || typeof modular !== 'object') return undefined
  const raw = modular as ModularAvatarState
  if (!raw.data) return undefined
  return resolveProfileModularAvatarForDisplay(raw)
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

/** Photo profil publique (data URL) — même filtre que la sauvegarde locale. */
export function profilePhotoFromPublicRow(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const trimmed = url.trim()
  if (!trimmed.startsWith('data:image/')) return undefined
  return trimmed
}

/** Identifiants démo / bots : pas de lecture cloud pour la PP modulaire. */
export function shouldFetchCloudChatAvatar(userId: string, selfUserId: string): boolean {
  if (!userId || userId === selfUserId || userId === 'me') return false
  if (userId.startsWith('group-bot:') || userId.startsWith('u-')) return false
  if (userId === 'u-tf-bot') return false
  return true
}
