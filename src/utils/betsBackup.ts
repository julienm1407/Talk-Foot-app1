import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import type { Bet } from '../types/bet'

type BetsBackupV1 = {
  v: 1
  savedAt: number
  bets: Bet[]
}

const MAX_BETS = 200

function storageKey(userId: string): string {
  return `talkfoot.bets.backup.v1.${userId.trim()}`
}

function isBet(value: unknown): value is Bet {
  if (!value || typeof value !== 'object') return false
  const b = value as Partial<Bet>
  return (
    typeof b.id === 'string' &&
    typeof b.matchId === 'string' &&
    typeof b.stake === 'number' &&
    typeof b.odds === 'number' &&
    typeof b.placedAt === 'string' &&
    typeof b.status === 'string'
  )
}

function normalizeBets(bets: Bet[]): Bet[] {
  return bets.filter(isBet).slice(0, MAX_BETS)
}

/** Fusionne les paris locaux et cloud (union par id, garde le plus récent). */
export function mergeBets(serverBets: Bet[], backupBets: Bet[]): Bet[] {
  const byId = new Map<string, Bet>()
  for (const b of normalizeBets(serverBets)) byId.set(b.id, b)
  for (const b of normalizeBets(backupBets)) {
    const prev = byId.get(b.id)
    if (!prev || b.placedAt >= prev.placedAt) byId.set(b.id, b)
  }
  return Array.from(byId.values())
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
    .slice(0, MAX_BETS)
}

export function writeBetsBackup(userId: string, bets: Bet[]): void {
  const key = userId.trim()
  if (!key) return
  const payload: BetsBackupV1 = {
    v: 1,
    savedAt: Date.now(),
    bets: normalizeBets(bets),
  }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function readBetsBackup(userId: string): BetsBackupV1 | null {
  const key = userId.trim()
  if (!key) return null
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BetsBackupV1>
    if (parsed.v !== 1 || typeof parsed.savedAt !== 'number' || !Array.isArray(parsed.bets)) return null
    return { v: 1, savedAt: parsed.savedAt, bets: normalizeBets(parsed.bets as Bet[]) }
  } catch {
    return null
  }
}

export function mergeBetsBackupIntoApp(
  userId: string,
  app: UserAppStateV1,
): { app: UserAppStateV1; restoredFromBackup: boolean } {
  const backup = readBetsBackup(userId)
  if (!backup || backup.bets.length === 0) return { app, restoredFromBackup: false }

  const merged = mergeBets(app.bets, backup.bets)
  const currentIds = new Set(app.bets.map((b) => b.id))
  const restoredFromBackup =
    merged.length > app.bets.length || merged.some((b) => !currentIds.has(b.id))

  if (!restoredFromBackup) return { app, restoredFromBackup: false }
  return { app: { ...app, bets: merged }, restoredFromBackup: true }
}

/** Avant écriture cloud : inclut les paris locaux pas encore synchronisés. */
export function coalesceAppStateWithBetsBackup(userId: string, app: UserAppStateV1): UserAppStateV1 {
  const backup = readBetsBackup(userId)
  if (!backup || backup.bets.length === 0) return app
  const merged = mergeBets(app.bets, backup.bets)
  if (merged.length === app.bets.length && merged.every((b, i) => b.id === app.bets[i]?.id)) {
    return app
  }
  return { ...app, bets: merged }
}
