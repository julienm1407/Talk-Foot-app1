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
      setCustom((prev) => [next, ...prev].slice(0, 30))
      setJoinedGroupIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      return next
    },
    [setCustom, setJoinedGroupIds],
  )

  const byId = useCallback(
    (id: string) => groups.find((g) => g.id === id) ?? null,
    [groups],
  )

  return {
    groups,
    createGroup,
    byId,
    joinedGroupIds,
    joinGroup,
    leaveGroup,
    isJoined,
  }
}

