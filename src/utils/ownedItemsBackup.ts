import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import { repairPackOwnedItemIds } from '../data/boutiqueEconomy'

type OwnedItemsBackupV1 = {
  v: 1
  savedAt: number
  ownedItemIds: string[]
}

function storageKey(userId: string): string {
  return `talkfoot.ownedItems.backup.v1.${userId.trim()}`
}

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  return repairPackOwnedItemIds(
    Array.from(
      new Set(
        ids
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim()),
      ),
    ),
  )
}

export function unionOwnedItemIds(a: string[], b: string[]): string[] {
  return normalizeIds([...a, ...b])
}

/** Ne shrink jamais le backup local : union avec l’existant (évite perte d’achat au reload). */
export function writeOwnedItemsBackup(userId: string, ownedItemIds: string[]): void {
  const key = userId.trim()
  if (!key) return
  const prev = readOwnedItemsBackup(key)
  const merged = unionOwnedItemIds(ownedItemIds, prev?.ownedItemIds ?? [])
  if (!merged.length && !prev?.ownedItemIds.length) return
  const payload: OwnedItemsBackupV1 = {
    v: 1,
    savedAt: Date.now(),
    ownedItemIds: merged,
  }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(payload))
    sessionStorage.setItem(storageKey(key), JSON.stringify(payload))
    sessionStorage.setItem('talkfoot.ownedItems.backup.v1.last', JSON.stringify({ ...payload, userId: key }))
  } catch {
    try {
      sessionStorage.setItem(storageKey(key), JSON.stringify(payload))
    } catch {
      /* quota / private mode */
    }
  }
}

export function readOwnedItemsBackup(userId: string): OwnedItemsBackupV1 | null {
  const key = userId.trim()
  if (!key) return null
  const parse = (raw: string | null): OwnedItemsBackupV1 | null => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<OwnedItemsBackupV1> & { userId?: string }
      if (parsed.v !== 1 || typeof parsed.savedAt !== 'number') return null
      return { v: 1, savedAt: parsed.savedAt, ownedItemIds: normalizeIds(parsed.ownedItemIds) }
    } catch {
      return null
    }
  }
  const fromLocal = parse(localStorage.getItem(storageKey(key)))
  const fromSession = parse(sessionStorage.getItem(storageKey(key)))
  let fromLast: OwnedItemsBackupV1 | null = null
  try {
    const lastRaw = sessionStorage.getItem('talkfoot.ownedItems.backup.v1.last')
    if (lastRaw) {
      const parsed = JSON.parse(lastRaw) as Partial<OwnedItemsBackupV1> & { userId?: string }
      if (parsed.userId === key || !parsed.userId) {
        fromLast = parse(lastRaw)
      }
    }
  } catch {
    fromLast = null
  }
  const candidates = [fromLocal, fromSession, fromLast].filter(Boolean) as OwnedItemsBackupV1[]
  if (!candidates.length) return null
  const ownedItemIds = unionOwnedItemIds(
    [],
    candidates.flatMap((c) => c.ownedItemIds),
  )
  const savedAt = Math.max(...candidates.map((c) => c.savedAt))
  return { v: 1, savedAt, ownedItemIds }
}

/** Avant écriture cloud : ne jamais perdre des ids déjà acquis sur cet appareil. */
export function coalesceAppStateWithOwnedItemsBackup(
  userId: string,
  app: UserAppStateV1,
): UserAppStateV1 {
  const backup = readOwnedItemsBackup(userId)
  if (!backup?.ownedItemIds.length) return app
  const current = normalizeIds(app.profile.ownedItemIds)
  const merged = unionOwnedItemIds(current, backup.ownedItemIds)
  if (merged.length === current.length && merged.every((id, i) => id === current[i])) {
    return app
  }
  const prem = normalizeIds(app.profile.premiumInventory?.ownedItemIds ?? [])
  return {
    ...app,
    profile: {
      ...app.profile,
      ownedItemIds: merged,
      premiumInventory: {
        ownedItemIds: unionOwnedItemIds(prem, backup.ownedItemIds),
        equippedByCategory: app.profile.premiumInventory?.equippedByCategory ?? {},
      },
    },
  }
}

/** À l’hydratation : union cloud ∪ backup local (achats pas encore poussés / écrasés). */
export function mergeOwnedItemsBackupIntoApp(
  userId: string,
  app: UserAppStateV1,
): { app: UserAppStateV1; restoredFromBackup: boolean } {
  const backup = readOwnedItemsBackup(userId)
  if (!backup?.ownedItemIds.length) return { app, restoredFromBackup: false }

  const current = normalizeIds(app.profile.ownedItemIds)
  const merged = unionOwnedItemIds(current, backup.ownedItemIds)
  if (merged.length === current.length && merged.every((id) => current.includes(id))) {
    return { app, restoredFromBackup: false }
  }

  const prem = normalizeIds(app.profile.premiumInventory?.ownedItemIds ?? [])
  return {
    app: {
      ...app,
      profile: {
        ...app.profile,
        ownedItemIds: merged,
        premiumInventory: {
          ownedItemIds: unionOwnedItemIds(prem, backup.ownedItemIds),
          equippedByCategory: app.profile.premiumInventory?.equippedByCategory ?? {},
        },
      },
    },
    restoredFromBackup: true,
  }
}
