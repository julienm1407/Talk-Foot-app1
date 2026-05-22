import type { Match } from '../types/match'

const CACHE_KEY = 'talkfoot.matches.cache.v1'
const TTL_MS = 5 * 60 * 1000

type Cached = { at: number; matches: Match[] }

export function readMatchesSessionCache(): Match[] {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Cached
    if (!parsed?.at || !Array.isArray(parsed.matches)) return []
    if (Date.now() - parsed.at > TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return []
    }
    return parsed.matches
  } catch {
    return []
  }
}

export function writeMatchesSessionCache(matches: Match[]): void {
  if (!matches.length) return
  try {
    const payload: Cached = { at: Date.now(), matches }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / mode privé strict */
  }
}
