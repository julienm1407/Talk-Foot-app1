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

export function writeOwnedItemsBackup(userId: string, ownedItemIds: string[]): void {
  const key = userId.trim()
  if (!key) return
  const payload: OwnedItemsBackupV1 = {
    v: 1,
    savedAt: Date.now(),
    ownedItemIds: normalizeIds(ownedItemIds),
  }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function readOwnedItemsBackup(userId: string): OwnedItemsBackupV1 | null {
  const key = userId.trim()
  if (!key) return null
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OwnedItemsBackupV1>
    if (parsed.v !== 1 || typeof parsed.savedAt !== 'number') return null
    return { v: 1, savedAt: parsed.savedAt, ownedItemIds: normalizeIds(parsed.ownedItemIds) }
  } catch {
    return null
  }
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
