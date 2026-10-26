import { useCallback, useEffect, useState } from 'react'
import type { MatchTribuneZone } from '../types/chat'

export const MATCH_TRIBUNE_ZONE_KEY = 'talkfoot.matchTribuneZone.v1'
const MAX_STORED = 80

const ZONES: readonly MatchTribuneZone[] = ['home-ultras', 'away-ultras', 'analystes', 'neutres']

export function isMatchTribuneZone(v: unknown): v is MatchTribuneZone {
  return typeof v === 'string' && (ZONES as readonly string[]).includes(v)
}

type Store = Record<string, MatchTribuneZone>

export function readMatchTribuneZoneStore(): Store {
  try {
    const raw = localStorage.getItem(MATCH_TRIBUNE_ZONE_KEY)
    if (!raw) return {}
    const p: unknown = JSON.parse(raw)
    if (p === null || typeof p !== 'object' || Array.isArray(p)) return {}
    const out: Store = {}
    for (const [k, val] of Object.entries(p as Record<string, unknown>)) {
      if (k && isMatchTribuneZone(val)) out[k] = val
    }
    return out
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(MATCH_TRIBUNE_ZONE_KEY, JSON.stringify(store))
  } catch {
    /* private mode */
  }
}

export function readMatchTribuneZone(matchId: string | undefined): MatchTribuneZone {
  if (!matchId) return 'neutres'
  return readMatchTribuneZoneStore()[matchId] ?? 'neutres'
}

export function writeMatchTribuneZone(matchId: string, zone: MatchTribuneZone): void {
  const all = readMatchTribuneZoneStore()
  delete all[matchId]
  all[matchId] = zone
  const keys = Object.keys(all)
  if (keys.length > MAX_STORED) {
    for (const k of keys.slice(0, keys.length - MAX_STORED)) delete all[k]
  }
  writeStore(all)
}

/** Tribune live du match : mémorisée (parcage / ultras / neutres) pour y revenir. */
export function useMatchTribune(matchId: string | undefined) {
  const [tribune, setTribuneState] = useState<MatchTribuneZone>(() => readMatchTribuneZone(matchId))

  useEffect(() => {
    setTribuneState(readMatchTribuneZone(matchId))
  }, [matchId])

  const setTribune = useCallback(
    (id: MatchTribuneZone) => {
      if (!isMatchTribuneZone(id)) return
      setTribuneState(id)
      if (matchId) writeMatchTribuneZone(matchId, id)
    },
    [matchId],
  )

  return { tribune, setTribune }
}
