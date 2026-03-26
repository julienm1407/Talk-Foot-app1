import { useCallback, useEffect, useState } from 'react'
import type { TribuneId } from '../types/tribune'

const KEY = 'talkfoot.matchTribune.v1'

type Store = Record<string, TribuneId>

function readAll(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const p: unknown = JSON.parse(raw)
    if (p === null || typeof p !== 'object' || Array.isArray(p)) return {}
    return p as Store
  } catch {
    return {}
  }
}

function writeAll(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function useMatchTribune(matchId: string | undefined) {
  const [tribune, setTribuneState] = useState<TribuneId>('virage')

  useEffect(() => {
    if (!matchId) return
    const all = readAll()
    const saved = all[matchId]
    if (saved === 'virage' || saved === 'analyse' || saved === 'chill') {
      setTribuneState(saved)
    } else {
      setTribuneState('virage')
    }
  }, [matchId])

  const setTribune = useCallback(
    (id: TribuneId) => {
      if (!matchId) return
      setTribuneState(id)
      const all = readAll()
      all[matchId] = id
      writeAll(all)
    },
    [matchId],
  )

  return { tribune, setTribune }
}
