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

function resolvedAvatar(state: ModularAvatarState | undefined | null): ModularAvatarState {
  return sanitizeModularAvatarState(resolveModularAvatarState(state ?? undefined))
}

/** Visage seulement (ignore maillot / short / chaussures). */
export function isLikelyDefaultFace(state: ModularAvatarState | undefined | null): boolean {
  const d = resolvedAvatar(state).data
  const colors = resolvedAvatar(state).slotColors
  const def = createDefaultModularAvatarState()
  return (
    d.skinTone === def.data.skinTone &&
    d.body === def.data.body &&
    d.hair === def.data.hair &&
    d.eyes === def.data.eyes &&
    d.nose === def.data.nose &&
    d.mouth === def.data.mouth &&
    d.beard === def.data.beard &&
    colors.hair === def.slotColors.hair &&
    colors.beard === def.slotColors.beard
  )
}

/**
 * Kit (maillot/short/chaussures) du premier argument + visage du second
 * si le premier n’a qu’un visage par défaut (achat boutique ne doit pas
 * écraser cheveux / barbe).
 */
export function mergeModularAvatarKeepFace(
  kitSource: ModularAvatarState | undefined | null,
  faceSource: ModularAvatarState | undefined | null,
): ModularAvatarState {
  const kit = resolvedAvatar(kitSource)
  const face = resolvedAvatar(faceSource)
  if (!isLikelyDefaultFace(kit) || isLikelyDefaultFace(face)) return kit
  return {
    data: {
      ...kit.data,
      skinTone: face.data.skinTone,
      body: face.data.body,
      hair: face.data.hair,
      eyes: face.data.eyes,
      eyebrows: face.data.eyebrows,
      nose: face.data.nose,
      mouth: face.data.mouth,
      beard: face.data.beard,
    },
    slotColors: {
      ...kit.slotColors,
      hair: face.slotColors.hair,
      beard: face.slotColors.beard,
    },
  }
}

function withMergedAvatar(app: UserAppStateV1, modularAvatar: ModularAvatarState): UserAppStateV1 {
  return {
    ...app,
    profile: {
      ...app.profile,
      modularAvatar,
    },
  }
}

/** True si le nouvel état efface une customisation (remplacée par défaut / vide). */
export function wouldDowngradeModularAvatar(
  previous: ModularAvatarState | unknown,
  next: ModularAvatarState | unknown,
): boolean {
  const prev = coerceModularAvatarFromStored(previous)
  const nxt = coerceModularAvatarFromStored(next)
  if (!prev) return false
  if (!nxt) return !isLikelyDefaultFace(prev) || !isLikelyDefaultModularAvatar(prev)
  if (!isLikelyDefaultFace(prev) && isLikelyDefaultFace(nxt)) return true
  if (!isLikelyDefaultModularAvatar(prev) && isLikelyDefaultModularAvatar(nxt)) return true
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
  const prev = readModularAvatarBackup(key)
  const merged = prev
    ? mergeModularAvatarKeepFace(modularAvatar, prev.modularAvatar)
    : resolvedAvatar(modularAvatar)
  const payload: ModularAvatarBackupV1 = {
    v: 1,
    savedAt: Date.now(),
    modularAvatar: merged,
  }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(payload))
    sessionStorage.setItem(storageKey(key), JSON.stringify(payload))
  } catch {
    try {
      sessionStorage.setItem(storageKey(key), JSON.stringify(payload))
    } catch {
      /* quota / private mode */
    }
  }
}

/** Avatar affiché : visage local si le cloud n’a encore que le kit / le défaut. */
export function resolveDisplayModularAvatar(
  userId: string | undefined,
  stored: ModularAvatarState | undefined | null,
): ModularAvatarState {
  const resolved = resolvedAvatar(stored)
  const key = userId?.trim()
  if (!key) return resolved

  const backup = readModularAvatarBackup(key)
  if (!backup) return resolved
  return mergeModularAvatarKeepFace(resolved, backup.modularAvatar)
}

/** Avant écriture cloud : garder le visage local si le payload n’a que le kit. */
export function coalesceAppStateWithModularBackup(
  userId: string,
  app: UserAppStateV1,
): UserAppStateV1 {
  const backup = readModularAvatarBackup(userId)
  if (!backup) return app
  const merged = mergeModularAvatarKeepFace(app.profile.modularAvatar, backup.modularAvatar)
  if (modularSignature(merged) === modularSignature(app.profile.modularAvatar)) return app
  return withMergedAvatar(app, merged)
}

export function readModularAvatarBackup(userId: string): ModularAvatarBackupV1 | null {
  const key = userId.trim()
  if (!key) return null
  const parse = (raw: string | null): ModularAvatarBackupV1 | null => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<ModularAvatarBackupV1>
      if (parsed.v !== 1 || typeof parsed.savedAt !== 'number') return null
      const modular = coerceModularAvatarFromStored(parsed.modularAvatar)
      if (!modular) return null
      return { v: 1, savedAt: parsed.savedAt, modularAvatar: modular }
    } catch {
      return null
    }
  }
  const fromLocal = parse(localStorage.getItem(storageKey(key)))
  const fromSession = parse(sessionStorage.getItem(storageKey(key)))
  if (fromLocal && fromSession) {
    return fromLocal.savedAt >= fromSession.savedAt ? fromLocal : fromSession
  }
  return fromLocal ?? fromSession
}

/** À l’hydratation : union visage local ∪ kit cloud (puis flush vers le compte). */
export function mergeModularAvatarBackupIntoApp(
  userId: string,
  app: UserAppStateV1,
): { app: UserAppStateV1; restoredFromBackup: boolean } {
  const backup = readModularAvatarBackup(userId)
  if (!backup) return { app, restoredFromBackup: false }

  const merged = mergeModularAvatarKeepFace(app.profile.modularAvatar, backup.modularAvatar)
  if (modularSignature(merged) === modularSignature(app.profile.modularAvatar)) {
    return { app, restoredFromBackup: false }
  }

  return {
    app: withMergedAvatar(app, merged),
    restoredFromBackup: true,
  }
}
