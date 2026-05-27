import { useCallback, useEffect, useState } from 'react'

const KEY = 'talkfoot.matchStadiumGroup.v1'

type Store = Record<string, string>

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

/**
 * Tribune supporter « tribune » choisi sur le plan stade : filtre le chat live
 * pour ne montrer que les messages de ce groupe (démo locale).
 */
export function useMatchStadiumGroup(matchId: string | undefined) {
  const [stadiumGroupId, setStadiumGroupState] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) return
    const all = readAll()
    const g = all[matchId]
    setStadiumGroupState(typeof g === 'string' && g.length > 0 ? g : null)
  }, [matchId])

  const setStadiumGroup = useCallback(
    (groupId: string | null) => {
      if (!matchId) return
      const all = readAll()
      if (groupId === null || groupId === '') {
        delete all[matchId]
        setStadiumGroupState(null)
      } else {
        all[matchId] = groupId
        setStadiumGroupState(groupId)
      }
      writeAll(all)
    },
    [matchId],
  )

  const clearStadiumGroup = useCallback(() => {
    if (!matchId) return
    const all = readAll()
    delete all[matchId]
    writeAll(all)
    setStadiumGroupState(null)
  }, [matchId])

  return { stadiumGroupId, setStadiumGroup, clearStadiumGroup }
}
