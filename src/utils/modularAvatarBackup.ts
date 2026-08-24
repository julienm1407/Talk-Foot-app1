import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import {
  coerceModularAvatarFromStored,
  createDefaultModularAvatarState,
  resolveModularAvatarState,
  sanitizeModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'
import {
  DEFAULT_MODULAR_JERSEY,
  DEFAULT_MODULAR_SHOES,
  DEFAULT_MODULAR_SHORTS,
} from './modularGarmentAccess'

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
  const resolved = resolvedAvatar(state)
  const d = resolved.data
  const colors = resolved.slotColors
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

/** Tenue boutique (maillot / short / chaussures). */
export function isLikelyDefaultKit(state: ModularAvatarState | undefined | null): boolean {
  const d = resolvedAvatar(state).data
  const def = createDefaultModularAvatarState().data
  const jerseyDefault =
    !d.jersey || d.jersey === def.jersey || d.jersey === DEFAULT_MODULAR_JERSEY
  const shortsDefault =
    !d.shorts || d.shorts === def.shorts || d.shorts === DEFAULT_MODULAR_SHORTS
  const shoesDefault =
    !d.shoes || d.shoes === def.shoes || d.shoes === DEFAULT_MODULAR_SHOES
  return jerseyDefault && shortsDefault && shoesDefault
}

/**
 * Fusionne deux avatars.
 * - Si `updatedAt` diffère : le plus récent gagne (PC ↔ téléphone).
 * - Sinon `preferred` gagne pour kit/visage custom, `fallback` complète les défauts.
 */
export function mergeModularAvatarLayers(
  preferred: ModularAvatarState | undefined | null,
  fallback: ModularAvatarState | undefined | null,
): ModularAvatarState {
  const rawA = preferred ?? null
  const rawB = fallback ?? null
  const aAt = typeof rawA?.updatedAt === 'number' ? rawA.updatedAt : 0
  const bAt = typeof rawB?.updatedAt === 'number' ? rawB.updatedAt : 0
  const newerFirst = bAt > aAt
  const primary = resolvedAvatar(newerFirst ? rawB : rawA)
  const secondary = resolvedAvatar(newerFirst ? rawA : rawB)
  const face = !isLikelyDefaultFace(primary) ? primary : secondary
  const kit = !isLikelyDefaultKit(primary) ? primary : secondary
  const updatedAt = Math.max(aAt, bAt)
  return {
    data: {
      ...primary.data,
      skinTone: face.data.skinTone,
      body: face.data.body,
      hair: face.data.hair,
      eyes: face.data.eyes,
      eyebrows: face.data.eyebrows,
      nose: face.data.nose,
      mouth: face.data.mouth,
      beard: face.data.beard,
      jersey: kit.data.jersey,
      shorts: kit.data.shorts,
      shoes: kit.data.shoes,
    },
    slotColors: {
      ...primary.slotColors,
      hair: face.slotColors.hair,
      beard: face.slotColors.beard,
      jersey: kit.slotColors.jersey,
      shorts: kit.slotColors.shorts,
      shoes: kit.slotColors.shoes,
    },
    ...(updatedAt > 0 ? { updatedAt } : {}),
  }
}

/** @deprecated Prefer mergeModularAvatarLayers — kept for call-site clarity. */
export function mergeModularAvatarKeepFace(
  kitSource: ModularAvatarState | undefined | null,
  faceSource: ModularAvatarState | undefined | null,
): ModularAvatarState {
  return mergeModularAvatarLayers(kitSource, faceSource)
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
  if (!nxt) {
    return (
      !isLikelyDefaultFace(prev) ||
      !isLikelyDefaultKit(prev) ||
      !isLikelyDefaultModularAvatar(prev)
    )
  }
  if (!isLikelyDefaultFace(prev) && isLikelyDefaultFace(nxt)) return true
  if (!isLikelyDefaultKit(prev) && isLikelyDefaultKit(nxt)) return true
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
    ? mergeModularAvatarLayers(modularAvatar, prev.modularAvatar)
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

/** Avatar affiché : complète kit/visage depuis le backup local si le cloud est en retard. */
export function resolveDisplayModularAvatar(
  userId: string | undefined,
  stored: ModularAvatarState | undefined | null,
): ModularAvatarState {
  const resolved = resolvedAvatar(stored)
  const key = userId?.trim()
  if (!key) return resolved

  const backup = readModularAvatarBackup(key)
  if (!backup) return resolved
  return mergeModularAvatarLayers(resolved, backup.modularAvatar)
}

/** Avant écriture cloud : ne jamais perdre visage ou kit custom stockés localement. */
export function coalesceAppStateWithModularBackup(
  userId: string,
  app: UserAppStateV1,
): UserAppStateV1 {
  const backup = readModularAvatarBackup(userId)
  if (!backup) return app
  const merged = mergeModularAvatarLayers(app.profile.modularAvatar, backup.modularAvatar)
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

/** À l’hydratation : union visage/kit local ∪ cloud (puis flush vers le compte). */
export function mergeModularAvatarBackupIntoApp(
  userId: string,
  app: UserAppStateV1,
): { app: UserAppStateV1; restoredFromBackup: boolean } {
  const backup = readModularAvatarBackup(userId)
  if (!backup) return { app, restoredFromBackup: false }

  const merged = mergeModularAvatarLayers(app.profile.modularAvatar, backup.modularAvatar)
  if (modularSignature(merged) === modularSignature(app.profile.modularAvatar)) {
    return { app, restoredFromBackup: false }
  }

  return {
    app: withMergedAvatar(app, merged),
    restoredFromBackup: true,
  }
}
