import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import {
  coerceModularAvatarFromStored,
  createDefaultModularAvatarState,
  resolveModularAvatarState,
  sanitizeModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'

type ModularAvatarBackupV1 = {
  v: 1
  savedAt: number
  modularAvatar: ModularAvatarState
}

function storageKey(userId: string): string {
  return `talkfoot.modularAvatar.v1.${userId.trim()}`
}

export function modularAvatarSignature(state: ModularAvatarState | undefined | null): string {
  const resolved = sanitizeModularAvatarState(resolveModularAvatarState(state ?? undefined))
  return JSON.stringify(resolved)
}

function modularSignature(state: ModularAvatarState | undefined | null): string {
  return modularAvatarSignature(state)
}

/** True si le nouvel état efface une customisation (remplacée par défaut / vide). */
export function wouldDowngradeModularAvatar(
  previous: ModularAvatarState | unknown,
  next: ModularAvatarState | unknown,
): boolean {
  const prev = coerceModularAvatarFromStored(previous)
  const nxt = coerceModularAvatarFromStored(next)
  if (!prev || isLikelyDefaultModularAvatar(prev)) return false
  // Custom → défaut / invalide = downgrade. Custom → autre custom = mise à jour OK.
  if (!nxt || isLikelyDefaultModularAvatar(nxt)) return true
  return false
}

export function extractStoredModularAvatar(appState: unknown): unknown {
  if (appState === null || typeof appState !== 'object' || Array.isArray(appState)) return undefined
  const profile = (appState as Record<string, unknown>).profile
  if (profile === null || typeof profile !== 'object' || Array.isArray(profile)) return undefined
  return (profile as Record<string, unknown>).modularAvatar
}

export function isLikelyDefaultModularAvatar(state: ModularAvatarState | undefined | null): boolean {
  const defaults = createDefaultModularAvatarState()
  return modularSignature(state) === modularSignature(defaults)
}

export function writeModularAvatarBackup(userId: string, modularAvatar: ModularAvatarState): void {
  const key = userId.trim()
  if (!key) return
  const payload: ModularAvatarBackupV1 = {
    v: 1,
    savedAt: Date.now(),
    modularAvatar: sanitizeModularAvatarState(modularAvatar),
  }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

/** Avatar affiché (nav, accueil) : priorité à la sauvegarde locale si le profil cloud est en retard. */
export function resolveDisplayModularAvatar(
  userId: string | undefined,
  stored: ModularAvatarState | undefined | null,
): ModularAvatarState {
  const resolved = sanitizeModularAvatarState(resolveModularAvatarState(stored ?? undefined))
  const key = userId?.trim()
  if (!key) return resolved

  const backup = readModularAvatarBackup(key)
  if (!backup) return resolved

  const backupResolved = backup.modularAvatar
  if (isLikelyDefaultModularAvatar(backupResolved)) return resolved
  // Cloud custom → source de vérité (évite divergence téléphone / PC).
  if (!isLikelyDefaultModularAvatar(resolved)) return resolved
  return backupResolved
}

/** Avant écriture cloud : ne jamais envoyer un skin par défaut si la sauvegarde locale est custom. */
export function coalesceAppStateWithModularBackup(
  userId: string,
  app: UserAppStateV1,
): UserAppStateV1 {
  const backup = readModularAvatarBackup(userId)
  if (!backup || isLikelyDefaultModularAvatar(backup.modularAvatar)) return app
  if (!isLikelyDefaultModularAvatar(app.profile.modularAvatar)) return app
  return {
    ...app,
    profile: {
      ...app.profile,
      modularAvatar: backup.modularAvatar,
    },
  }
}

export function readModularAvatarBackup(userId: string): ModularAvatarBackupV1 | null {
  const key = userId.trim()
  if (!key) return null
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ModularAvatarBackupV1>
    if (parsed.v !== 1 || typeof parsed.savedAt !== 'number') return null
    const modular = coerceModularAvatarFromStored(parsed.modularAvatar)
    if (!modular) return null
    return { v: 1, savedAt: parsed.savedAt, modularAvatar: modular }
  } catch {
    return null
  }
}

/** Réapplique une sauvegarde locale si le cloud n'a pas (encore) la customisation. */
export function mergeModularAvatarBackupIntoApp(
  userId: string,
  app: UserAppStateV1,
): { app: UserAppStateV1; restoredFromBackup: boolean } {
  const backup = readModularAvatarBackup(userId)
  if (!backup) return { app, restoredFromBackup: false }

  const serverSig = modularSignature(app.profile.modularAvatar)
  const backupSig = modularSignature(backup.modularAvatar)
  if (serverSig === backupSig) return { app, restoredFromBackup: false }

  const serverLooksDefault = isLikelyDefaultModularAvatar(app.profile.modularAvatar)
  const backupHasCustomization = !isLikelyDefaultModularAvatar(backup.modularAvatar)

  // Ne jamais remplacer un avatar cloud custom par une sauvegarde locale.
  // Sinon téléphone et PC divergent (localStorage isolé par origine).
  if (!serverLooksDefault) {
    return { app, restoredFromBackup: false }
  }

  const shouldRestore = backupHasCustomization

  if (!shouldRestore) return { app, restoredFromBackup: false }

  return {
    app: {
      ...app,
      profile: {
        ...app.profile,
        modularAvatar: backup.modularAvatar,
      },
    },
    restoredFromBackup: true,
  }
}
