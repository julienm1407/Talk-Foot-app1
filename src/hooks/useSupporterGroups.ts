import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { starterGroups } from '../data/groups'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { deleteCloudGroupMembership, upsertCloudGroupMembership } from '../lib/supabase/groupMembership'
import {
  fetchCloudSupporterGroups,
  upsertCloudSupporterGroup,
} from '../lib/supabase/supporterGroupsRegistry'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { SupporterGroup } from '../types/group'
import { normalizeHashtagList } from '../utils/groupHashtags'

function joinedKeyForUser(userId: string) {
  return `talkfoot.joinedGroupIds.v1.${userId}`
}

function customGroupsKeyForUser(userId: string) {
  return `talkfoot.groups.v1.${userId}`
}

function readJsonArray<T>(key: string, guard: (p: unknown) => p is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return [] as T
    const parsed: unknown = JSON.parse(raw)
    if (!guard(parsed)) return [] as T
    return parsed
  } catch {
    return [] as T
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

const isStringArray = (p: unknown): p is string[] => Array.isArray(p) && p.every((x) => typeof x === 'string')
const isSupporterGroupArray = (p: unknown): p is SupporterGroup[] =>
  Array.isArray(p) && p.every((g) => g && typeof g === 'object' && typeof (g as SupporterGroup).id === 'string')

export function useSupporterGroups() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id && !authUser.isAnonymous ? authUser.id : null

  const [custom, setCustom] = useState<SupporterGroup[]>([])
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([])
  const [cloudGroups, setCloudGroups] = useState<SupporterGroup[]>([])

  /** Chaque compte a son propre stockage local (évite qu’un nouveau compte hérite des salons du précédent). */
  useEffect(() => {
    if (!userId) {
      setCustom([])
      setJoinedGroupIds([])
      return
    }
    setJoinedGroupIds(readJsonArray(joinedKeyForUser(userId), isStringArray))
    setCustom(readJsonArray(customGroupsKeyForUser(userId), isSupporterGroupArray))
  }, [userId])

  const groups = useMemo(() => {
    const byId = new Map<string, SupporterGroup>()
    for (const g of starterGroups) byId.set(g.id, g)
    for (const g of cloudGroups) byId.set(g.id, g)
    for (const g of custom) byId.set(g.id, g)
    return Array.from(byId.values()).sort((a, b) => b.intensity - a.intensity)
  }, [custom, cloudGroups])

  const persistJoined = useCallback(
    (ids: string[]) => {
      if (!userId) return
      writeJson(joinedKeyForUser(userId), ids)
    },
    [userId],
  )

  const persistCustom = useCallback(
    (next: SupporterGroup[]) => {
      if (!userId) return
      writeJson(customGroupsKeyForUser(userId), next)
    },
    [userId],
  )

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    let cancelled = false
    void (async () => {
      const [membersRes, cloud] = await Promise.all([
        sb.from('supporter_group_members').select('group_id').eq('user_id', userId),
        fetchCloudSupporterGroups(sb),
      ])
      if (cancelled) return
      if (cloud.length) setCloudGroups(cloud)

      const { data, error } = membersRes
      if (error) return

      const cloudJoined = (data ?? [])
        .map((row) => row?.group_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)

      setJoinedGroupIds(cloudJoined)
      persistJoined(cloudJoined)
    })()
    return () => {
      cancelled = true
    }
  }, [userId, persistJoined])

  const joinGroup = useCallback(
    (id: string) => {
      if (!userId) return
      setJoinedGroupIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id]
        persistJoined(next)
        return next
      })
      const sb = getSupabaseBrowserClient()
      if (sb && isSupabaseConfigured()) {
        void upsertCloudGroupMembership(sb, id)
      }
    },
    [userId, persistJoined],
  )

  const leaveGroup = useCallback(
    (id: string) => {
      if (!userId) return
      setJoinedGroupIds((prev) => {
        const next = prev.filter((x) => x !== id)
        persistJoined(next)
        return next
      })
      const sb = getSupabaseBrowserClient()
      if (sb && isSupabaseConfigured()) {
        void deleteCloudGroupMembership(sb, id)
      }
    },
    [userId, persistJoined],
  )

  const isJoined = useCallback(
    (id: string) => joinedGroupIds.includes(id),
    [joinedGroupIds],
  )

  const createGroup = useCallback(
    (g: Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>) => {
      if (!userId) {
        throw new Error('Connexion requise pour créer un groupe.')
      }
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
        persistCustom(merged)
        return merged
      })
      setJoinedGroupIds((prev) => {
        const joined = prev.includes(id) ? prev : [...prev, id]
        persistJoined(joined)
        return joined
      })
      const sb = getSupabaseBrowserClient()
      if (sb && isSupabaseConfigured()) {
        void upsertCloudSupporterGroup(sb, next, userId)
        void upsertCloudGroupMembership(sb, id)
      }
      return next
    },
    [userId, persistCustom, persistJoined],
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
        persistCustom(next)
        return next
      })
    },
    [persistCustom],
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
