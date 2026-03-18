import { useCallback, useMemo } from 'react'
import { starterGroups } from '../data/groups'
import type { SupporterGroup } from '../types/group'
import { useLocalStorageState } from './useLocalStorage'

const KEY = 'talkfoot.groups.v1'

export function useSupporterGroups() {
  const [custom, setCustom] = useLocalStorageState<SupporterGroup[]>(KEY, [])

  const groups = useMemo(() => {
    const merged = [...custom, ...starterGroups]
    return merged.sort((a, b) => b.intensity - a.intensity)
  }, [custom])

  const createGroup = useCallback(
    (g: Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>) => {
      const id = `g-me-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const next: SupporterGroup = {
        ...g,
        id,
        createdBy: 'me',
        createdAt: new Date().toISOString(),
      }
      setCustom((prev) => [next, ...prev].slice(0, 30))
      return next
    },
    [setCustom],
  )

  const byId = useCallback(
    (id: string) => groups.find((g) => g.id === id) ?? null,
    [groups],
  )

  return { groups, createGroup, byId }
}

