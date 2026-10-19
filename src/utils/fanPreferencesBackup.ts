import type { FanPreferencesStoredShape, FavoritePlayerFollow } from '../types/fanPreferences'

const MAX_FAVORITE_CLUBS = 3
const MAX_FAVORITE_NATIONS = 5
const MAX_FAVORITE_MATCHES = 24
const MAX_FAVORITE_PLAYERS = 12

function storageKey(userId: string): string {
  return `talkfoot.fanPreferences.backup.v1.${userId.trim()}`
}

export function normalizeFavoriteClubIds(stored: FanPreferencesStoredShape): string[] {
  const fromArray = stored.favoriteClubIds
  if (Array.isArray(fromArray) && fromArray.length > 0) {
    return [...new Set(fromArray.filter(Boolean))].slice(0, MAX_FAVORITE_CLUBS)
  }
  if (stored.favoriteClubId) return [stored.favoriteClubId]
  return []
}

function normalizeNationIsos(stored: FanPreferencesStoredShape): string[] {
  const raw = stored.favoriteNationIsos
  if (!Array.isArray(raw)) return []
  return [
    ...new Set(
      raw
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .map((v) => v.toUpperCase()),
    ),
  ].slice(0, MAX_FAVORITE_NATIONS)
}

export function normalizeFavoriteMatchIds(stored: FanPreferencesStoredShape): string[] {
  const raw = stored.favoriteMatchIds
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((v): v is string => typeof v === 'string' && v.length > 0))].slice(
    0,
    MAX_FAVORITE_MATCHES,
  )
}

export function normalizeFavoritePlayers(stored: FanPreferencesStoredShape): FavoritePlayerFollow[] {
  const raw = stored.favoritePlayers
  if (!Array.isArray(raw)) return []
  const out: FavoritePlayerFollow[] = []
  const seen = new Set<number>()
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const playerId = Number(row.playerId)
    const name = String(row.name ?? '').trim()
    const teamId = String(row.teamId ?? '').trim()
    if (!Number.isFinite(playerId) || playerId <= 0 || !name || !teamId) continue
    if (seen.has(playerId)) continue
    seen.add(playerId)
    out.push({ playerId, name, teamId })
    if (out.length >= MAX_FAVORITE_PLAYERS) break
  }
  return out
}

/**
 * Ne jamais remplacer une sélection clubs/ligue remplie par un blob cloud vide
 * (cause classique : F5 / soft-resync après nos flushes inventaire).
 */
export function mergeFanPreferencesKeepFilled(
  a: FanPreferencesStoredShape | undefined | null,
  b: FanPreferencesStoredShape | undefined | null,
): FanPreferencesStoredShape {
  const left = a ?? {}
  const right = b ?? {}
  const clubs = [
    ...new Set([...normalizeFavoriteClubIds(left), ...normalizeFavoriteClubIds(right)]),
  ].slice(0, MAX_FAVORITE_CLUBS)
  const nations = [
    ...new Set([...normalizeNationIsos(left), ...normalizeNationIsos(right)]),
  ].slice(0, MAX_FAVORITE_NATIONS)
  const matchIds = [
    ...new Set([...normalizeFavoriteMatchIds(left), ...normalizeFavoriteMatchIds(right)]),
  ].slice(0, MAX_FAVORITE_MATCHES)
  const playersById = new Map<number, FavoritePlayerFollow>()
  for (const p of [...normalizeFavoritePlayers(right), ...normalizeFavoritePlayers(left)]) {
    playersById.set(p.playerId, p)
  }
  const favoritePlayers = [...playersById.values()].slice(0, MAX_FAVORITE_PLAYERS)
  const league = left.favoriteLeagueId || right.favoriteLeagueId || null
  const preferencesComplete = Boolean(
    left.preferencesComplete ||
      right.preferencesComplete ||
      Boolean(league) ||
      clubs.length > 0,
  )
  return {
    favoriteLeagueId: league,
    favoriteClubIds: clubs,
    favoriteClubId: clubs[0] ?? null,
    favoriteNationIsos: nations,
    favoriteMatchIds: matchIds,
    favoritePlayers,
    preferencesComplete,
    hideRivalSalons: left.hideRivalSalons ?? right.hideRivalSalons ?? false,
    virageMode: left.virageMode ?? right.virageMode ?? false,
    kickoffAlertsEnabled: left.kickoffAlertsEnabled ?? right.kickoffAlertsEnabled,
  }
}

export function writeFanPreferencesBackup(
  userId: string,
  fanPreferences: FanPreferencesStoredShape,
): void {
  const key = userId.trim()
  if (!key) return
  const prev = readFanPreferencesBackup(key)
  const merged = mergeFanPreferencesKeepFilled(fanPreferences, prev ?? {})
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(merged))
    sessionStorage.setItem(storageKey(key), JSON.stringify(merged))
  } catch {
    try {
      sessionStorage.setItem(storageKey(key), JSON.stringify(merged))
    } catch {
      /* quota */
    }
  }
}

export function readFanPreferencesBackup(userId: string): FanPreferencesStoredShape | null {
  const key = userId.trim()
  if (!key) return null
  const parse = (raw: string | null): FanPreferencesStoredShape | null => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as FanPreferencesStoredShape
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      return parsed
    } catch {
      return null
    }
  }
  const fromLocal = parse(localStorage.getItem(storageKey(key)))
  const fromSession = parse(sessionStorage.getItem(storageKey(key)))
  if (fromLocal && fromSession) return mergeFanPreferencesKeepFilled(fromLocal, fromSession)
  return fromLocal ?? fromSession
}

export function coalesceAppStateWithFanPreferencesBackup<
  T extends { fanPreferences: FanPreferencesStoredShape },
>(userId: string, app: T): T {
  const backup = readFanPreferencesBackup(userId)
  if (!backup) return app
  const merged = mergeFanPreferencesKeepFilled(app.fanPreferences, backup)
  if (JSON.stringify(merged) === JSON.stringify(app.fanPreferences ?? {})) return app
  return { ...app, fanPreferences: merged }
}

export function mergeFanPreferencesBackupIntoApp<
  T extends { fanPreferences: FanPreferencesStoredShape },
>(userId: string, app: T): { app: T; restoredFromBackup: boolean } {
  const backup = readFanPreferencesBackup(userId)
  if (!backup) return { app, restoredFromBackup: false }
  const merged = mergeFanPreferencesKeepFilled(app.fanPreferences, backup)
  if (JSON.stringify(merged) === JSON.stringify(app.fanPreferences ?? {})) {
    return { app, restoredFromBackup: false }
  }
  return { app: { ...app, fanPreferences: merged }, restoredFromBackup: true }
}
