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

function modularSignature(state: ModularAvatarState | undefined | null): string {
  const resolved = sanitizeModularAvatarState(resolveModularAvatarState(state ?? undefined))
  return JSON.stringify(resolved)
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
  const serverResolved = resolveModularAvatarState(app.profile.modularAvatar)
  const backupResolved = backup.modularAvatar
  const backupHasMoreCustomization =
    Boolean(backupResolved.data.beard && !serverResolved.data.beard) ||
    Boolean(backupResolved.data.hair && backupResolved.data.hair !== serverResolved.data.hair) ||
    Boolean(backupResolved.data.jersey && backupResolved.data.jersey !== serverResolved.data.jersey)

  const backupIsRecent = Date.now() - backup.savedAt < 7 * 24 * 60 * 60 * 1000
  const shouldRestore =
    serverLooksDefault || backupHasMoreCustomization || (backupIsRecent && serverSig !== backupSig)

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
