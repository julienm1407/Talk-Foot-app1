import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { channelsForSupporterGroup } from '../data/defaultGroupChannels'
import { starterGroups } from '../data/groups'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { deleteCloudGroupMembership, upsertCloudGroupMembership } from '../lib/supabase/groupMembership'
import {
  fetchCloudSupporterGroups,
  upsertCloudSupporterGroup,
} from '../lib/supabase/supporterGroupsRegistry'
import { fetchGroupActivityStats } from '../lib/supabase/groupActivityStats'
import { fetchGroupActivePresence } from '../lib/supabase/groupActivePresence'
import { fetchSupporterGroupMemberCounts } from '../lib/supabase/groupMemberCounts'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { ensureTalkFootSupabaseSession, isClerkAuthMode } from '../lib/supabase/talkfootSession'
import type { GroupActivePresence, SupporterGroup } from '../types/group'
import { normalizeHashtagList } from '../utils/groupHashtags'
import { computeGroupIntensity } from '../utils/groupIntensity'

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
  const [activityByGroupId, setActivityByGroupId] = useState<
    Map<string, { messagesToday: number; reactionsToday: number; onlineNow: number }>
  >(() => new Map())
  const [memberCountsByGroupId, setMemberCountsByGroupId] = useState<Map<string, number>>(
    () => new Map(),
  )
  const [presenceByGroupId, setPresenceByGroupId] = useState<Map<string, GroupActivePresence[]>>(
    () => new Map(),
  )
  const [supabaseActorId, setSupabaseActorId] = useState<string | null>(null)
  const cloudRefreshSeq = useRef(0)
  const refreshCloudGroupsRef = useRef<() => Promise<void>>(async () => {})
  const refreshMemberCountsRef = useRef<(groupIds: string[]) => Promise<void>>(async () => {})
  const refreshGroupPresenceRef = useRef<(groupIds: string[]) => Promise<void>>(async () => {})
  const rawGroupIdsRef = useRef<string[]>([])
  const realtimeMountSeq = useRef(0)

  /** Chaque compte a son propre stockage local (évite qu’un nouveau compte hérite des tribunes du précédent). */
  useEffect(() => {
    if (!userId) {
      setCustom([])
      setJoinedGroupIds([])
      return
    }
    setJoinedGroupIds(readJsonArray(joinedKeyForUser(userId), isStringArray))
    setCustom(readJsonArray(customGroupsKeyForUser(userId), isSupporterGroupArray))
  }, [userId])

  const enrichChannels = useCallback(
    (g: SupporterGroup): SupporterGroup => ({
      ...g,
      channels: channelsForSupporterGroup(g.channels),
    }),
    [],
  )

  const rawGroups = useMemo(() => {
    const byId = new Map<string, SupporterGroup>()
    for (const g of starterGroups) byId.set(g.id, enrichChannels(g))
    for (const g of cloudGroups) byId.set(g.id, enrichChannels(g))
    for (const g of custom) byId.set(g.id, enrichChannels(g))
    return Array.from(byId.values())
  }, [custom, cloudGroups, enrichChannels])

  const refreshGroupActivity = useCallback(async (groupIds: string[]) => {
    if (!groupIds.length) {
      setActivityByGroupId(new Map())
      return
    }
    if (!isSupabaseConfigured()) {
      setActivityByGroupId(new Map())
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const map = await fetchGroupActivityStats(sb, groupIds)
    setActivityByGroupId(map)
  }, [])

  const refreshGroupPresence = useCallback(async (groupIds: string[]) => {
    if (!groupIds.length) {
      setPresenceByGroupId(new Map())
      return
    }
    if (!isSupabaseConfigured()) {
      setPresenceByGroupId(new Map())
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const map = await fetchGroupActivePresence(sb, groupIds)
    setPresenceByGroupId(map)
  }, [])

  const refreshMemberCounts = useCallback(async (groupIds: string[]) => {
    if (!groupIds.length) {
      setMemberCountsByGroupId(new Map())
      return
    }
    if (!isSupabaseConfigured()) {
      setMemberCountsByGroupId(new Map())
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const map = await fetchSupporterGroupMemberCounts(sb, groupIds)
    setMemberCountsByGroupId(map)
  }, [])

  useEffect(() => {
    refreshMemberCountsRef.current = refreshMemberCounts
  }, [refreshMemberCounts])

  useEffect(() => {
    refreshGroupPresenceRef.current = refreshGroupPresence
  }, [refreshGroupPresence])

  useEffect(() => {
    rawGroupIdsRef.current = rawGroups.map((g) => g.id)
  }, [rawGroups])

  useEffect(() => {
    const ids = rawGroups.map((g) => g.id)
    void refreshGroupActivity(ids)
    void refreshMemberCounts(ids)
    void refreshGroupPresence(ids)
    const t = window.setInterval(() => {
      void refreshGroupActivity(ids)
      void refreshMemberCounts(ids)
      void refreshGroupPresence(ids)
    }, 45_000)
    return () => window.clearInterval(t)
  }, [rawGroups, refreshGroupActivity, refreshMemberCounts, refreshGroupPresence])

  const resolveMemberCount = useCallback(
    (g: SupporterGroup): number => {
      if (isSupabaseConfigured()) {
        const fromDb = memberCountsByGroupId.get(g.id)
        if (fromDb != null) return fromDb
        if (g.createdBy === 'me') return 1
        return 0
      }
      if (g.createdBy === 'me') return 1
      return joinedGroupIds.includes(g.id) ? 1 : 0
    },
    [memberCountsByGroupId, joinedGroupIds],
  )

  const groups = useMemo(() => {
    return rawGroups
      .map((g) => {
        const activity = activityByGroupId.get(g.id)
        const messagesToday = activity?.messagesToday ?? 0
        const reactionsToday = activity?.reactionsToday ?? 0
        const onlineNow = activity?.onlineNow ?? 0
        return {
          ...g,
          members: resolveMemberCount(g),
          onlineNow,
          messagesToday,
          reactionsToday,
          intensity: computeGroupIntensity({
            messagesToday,
            reactionsToday,
            onlineNow,
          }),
          activePresence: presenceByGroupId.get(g.id) ?? [],
        }
      })
      .sort((a, b) => b.intensity - a.intensity)
  }, [rawGroups, activityByGroupId, presenceByGroupId, resolveMemberCount])

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

  const refreshCloudGroups = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const seq = ++cloudRefreshSeq.current
    const session = await ensureTalkFootSupabaseSession(sb)
    if (!session || seq !== cloudRefreshSeq.current) return
    await syncRealtimeAuth(sb)
    setSupabaseActorId(session.user.id)

    const viewer = {
      supabaseUserId: session.user.id,
      clerkUserId: isClerkAuthMode() ? userId : null,
    }

    const [membersRes, cloud] = await Promise.all([
      sb.from('supporter_group_members').select('group_id').eq('user_id', session.user.id),
      fetchCloudSupporterGroups(sb, viewer),
    ])
    if (seq !== cloudRefreshSeq.current) return
    setCloudGroups(cloud)

    const { data, error } = membersRes
    if (!error) {
      const cloudJoined = (data ?? [])
        .map((row) => row?.group_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
      setJoinedGroupIds(cloudJoined)
      persistJoined(cloudJoined)
    }
  }, [userId, persistJoined])

  useEffect(() => {
    refreshCloudGroupsRef.current = refreshCloudGroups
  }, [refreshCloudGroups])

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) {
      setCloudGroups([])
      setSupabaseActorId(null)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    const mountId = ++realtimeMountSeq.current
    let cancelled = false
    let channel: ReturnType<typeof sb.channel> | null = null

    const run = async () => {
      await refreshCloudGroupsRef.current()
      if (cancelled || mountId !== realtimeMountSeq.current) return

      channel = sb
        .channel(`supporter_groups_registry:${userId}:${mountId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'supporter_groups' },
          () => {
            void refreshCloudGroupsRef.current()
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'supporter_group_members' },
          () => {
            const ids = rawGroupIdsRef.current
            void refreshMemberCountsRef.current(ids)
            void refreshGroupPresenceRef.current(ids)
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] supporter_groups realtime:', status)
          }
        })
    }

    void run()

    return () => {
      cancelled = true
      if (channel) void sb.removeChannel(channel)
    }
  }, [userId])

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
        void (async () => {
          await upsertCloudGroupMembership(sb, id)
          const ids = rawGroups.map((g) => g.id)
          void refreshMemberCounts(ids)
          void refreshGroupPresence(ids)
        })()
      }
    },
    [userId, persistJoined, rawGroups, refreshMemberCounts, refreshGroupPresence],
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
        void (async () => {
          await deleteCloudGroupMembership(sb, id)
          const ids = rawGroups.map((g) => g.id)
          void refreshMemberCounts(ids)
          void refreshGroupPresence(ids)
        })()
      }
    },
    [userId, persistJoined, rawGroups, refreshMemberCounts, refreshGroupPresence],
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
        onlineNow: 0,
        messagesToday: 0,
        reactionsToday: 0,
        intensity: computeGroupIntensity({ messagesToday: 0, reactionsToday: 0, onlineNow: 0 }),
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
        void (async () => {
          const session = await ensureTalkFootSupabaseSession(sb)
          if (!session) {
            console.error('[Talk Foot] Création groupe : session Supabase indisponible.')
            return
          }
          setSupabaseActorId(session.user.id)
          const ownerClerkId = isClerkAuthMode() ? userId : null
          const reg = await upsertCloudSupporterGroup(
            sb,
            next,
            session.user.id,
            ownerClerkId,
          )
          if (!reg.ok) return
          await upsertCloudGroupMembership(sb, id)
          await refreshCloudGroups()
        })()
      }
      return next
    },
    [userId, persistCustom, persistJoined, refreshCloudGroups],
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
        const updated = next[idx]
        const sb = getSupabaseBrowserClient()
        if (sb && isSupabaseConfigured() && supabaseActorId) {
          void upsertCloudSupporterGroup(
            sb,
            updated,
            supabaseActorId,
            isClerkAuthMode() ? userId : null,
          )
        }
        return next
      })
    },
    [persistCustom, supabaseActorId, userId],
  )

  const refreshGroupActivityNow = useCallback(() => {
    const ids = rawGroups.map((g) => g.id)
    void refreshGroupActivity(ids)
    void refreshMemberCounts(ids)
    void refreshGroupPresence(ids)
  }, [rawGroups, refreshGroupActivity, refreshMemberCounts, refreshGroupPresence])

  return {
    groups,
    createGroup,
    updateGroup,
    byId,
    joinedGroupIds,
    joinGroup,
    leaveGroup,
    isJoined,
    refreshCloudGroups,
    refreshGroupActivity: refreshGroupActivityNow,
  }
}
