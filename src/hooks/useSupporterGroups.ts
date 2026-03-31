import { useCallback, useMemo } from 'react'
import { starterGroups } from '../data/groups'
import type { SupporterGroup } from '../types/group'
import { normalizeHashtagList } from '../utils/groupHashtags'
import { useLocalStorageState } from './useLocalStorage'

const KEY = 'talkfoot.groups.v1'
const JOINED_KEY = 'talkfoot.joinedGroupIds.v1'

const isStringArray = (p: unknown): p is string[] => Array.isArray(p) && p.every((x) => typeof x === 'string')

export function useSupporterGroups() {
  const [custom, setCustom] = useLocalStorageState<SupporterGroup[]>(
    KEY,
    [],
    Array.isArray,
  )

  const [joinedGroupIds, setJoinedGroupIds] = useLocalStorageState<string[]>(
    JOINED_KEY,
    [],
    isStringArray,
  )

  const groups = useMemo(() => {
    const merged = [...custom, ...starterGroups]
    return merged.sort((a, b) => b.intensity - a.intensity)
  }, [custom])

  const joinGroup = useCallback(
    (id: string) => {
      setJoinedGroupIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
    [setJoinedGroupIds],
  )

  const leaveGroup = useCallback(
    (id: string) => {
      setJoinedGroupIds((prev) => prev.filter((x) => x !== id))
    },
    [setJoinedGroupIds],
  )

  const isJoined = useCallback(
    (id: string) => joinedGroupIds.includes(id),
    [joinedGroupIds],
  )

  const createGroup = useCallback(
    (g: Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>) => {
      const id = `g-me-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const hashtags =
        g.hashtags?.length ? normalizeHashtagList(g.hashtags) : undefined
      const next: SupporterGroup = {
        ...g,
        id,
        createdBy: 'me',
        createdAt: new Date().toISOString(),
        onlineNow: g.onlineNow ?? 1,
        messagesToday: g.messagesToday ?? 0,
        groupKind: g.groupKind ?? 'public',
        lastMessagePreview: g.lastMessagePreview ?? 'Nouveau groupe — dis bonjour !',
        hashtags: hashtags?.length ? hashtags : undefined,
      }
      setCustom((prev) => {
        const merged = [next, ...prev].slice(0, 30)
        try {
          localStorage.setItem(KEY, JSON.stringify(merged))
        } catch {
          /* ignore quota / private mode */
        }
        return merged
      })
      setJoinedGroupIds((prev) => {
        const joined = prev.includes(id) ? prev : [...prev, id]
        try {
          localStorage.setItem(JOINED_KEY, JSON.stringify(joined))
        } catch {
          /* ignore */
        }
        return joined
      })
      return next
    },
    [setCustom, setJoinedGroupIds],
  )

  const byId = useCallback(
    (id: string) => groups.find((g) => g.id === id) ?? null,
    [groups],
  )

  const updateGroup = useCallback(
    (
      id: string,
      patch: Partial<Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>>,
    ) => {
      setCustom((prev) => {
        const idx = prev.findIndex((g) => g.id === id)
        if (idx < 0) return prev
        const cur = prev[idx]
        const mergedTheme =
          patch.theme !== undefined
            ? { ...cur.theme, ...patch.theme }
            : cur.theme
        const nextGroup: SupporterGroup = {
          ...cur,
          ...patch,
          id: cur.id,
          createdAt: cur.createdAt,
          createdBy: cur.createdBy,
          theme: mergedTheme,
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'presentationMedia')) {
          if (patch.presentationMedia === undefined) delete nextGroup.presentationMedia
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'scarf')) {
          if (patch.scarf === undefined) delete nextGroup.scarf
        }
        const next = [...prev]
        next[idx] = nextGroup
        try {
          localStorage.setItem(KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [setCustom],
  )

  return {
    groups,
    createGroup,
    updateGroup,
    byId,
    joinedGroupIds,
    joinGroup,
    leaveGroup,
    isJoined,
  }
}

