import { toParisDayKey } from './dailyTokenBonus'

const PREFIX = 'talkfoot.dailyTokenGrant.v1'

function storageKey(userId: string): string {
  return `${PREFIX}:${userId}`
}

/** Sauvegarde locale anti double-récupération (complète le cloud). */
export function readLocalDailyTokenGrant(userId: string | undefined): string | undefined {
  if (!userId) return undefined
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  } catch {
    /* mode privé */
  }
  return undefined
}

export function writeLocalDailyTokenGrant(userId: string | undefined, dayKey = toParisDayKey()): void {
  if (!userId) return
  try {
    localStorage.setItem(storageKey(userId), dayKey)
  } catch {
    /* mode privé */
  }
}

/** Fusionne cloud + cache local (le plus récent l'emporte). */
export function mergeDailyTokenGrant(
  walletGrant: string | undefined,
  userId: string | undefined,
): string | undefined {
  const local = readLocalDailyTokenGrant(userId)
  if (!walletGrant) return local
  if (!local) return walletGrant
  return walletGrant >= local ? walletGrant : local
}
