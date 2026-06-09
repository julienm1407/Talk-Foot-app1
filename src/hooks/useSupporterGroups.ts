import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { channelsForSupporterGroup } from '../data/defaultGroupChannels'
import { starterGroups } from '../data/groups'
import { stripDemoPresentationMedia } from '../utils/groupPresentationMedia'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { deleteCloudGroupMembership, upsertCloudGroupMembership } from '../lib/supabase/groupMembership'
import {
  deleteCloudSupporterGroup,
  fetchCloudSupporterGroups,
  upsertCloudSupporterGroup,
} from '../lib/supabase/supporterGroupsRegistry'
import { removeCustomDebatesForGroup } from '../utils/customGroupDebatesStorage'
import { fetchGroupActivityStats } from '../lib/supabase/groupActivityStats'
import { fetchGroupActivePresence } from '../lib/supabase/groupActivePresence'
import { fetchSupporterGroupMemberCounts } from '../lib/supabase/groupMemberCounts'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { ensureTalkFootSupabaseSession, isClerkAuthMode } from '../lib/supabase/talkfootSession'
import type { GroupActivePresence, SupporterGroup } from '../types/group'
import { normalizeHashtagList } from '../utils/groupHashtags'
import { computeGroupIntensity } from '../utils/groupIntensity'
import { useSubscription } from './useSubscription'
import {
  canCreateGroup,
  createGroupLimitMessage,
  joinGroupLimitMessage,
  canJoinGroup,
  canJoinGroupByMemberCap,
  groupMemberCapForTier,
} from '../utils/subscriptionEntitlements'

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
  const isAdmin = Boolean(authUser?.isAdmin)
  const { tier, plan } = useSubscription()
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
  const refreshCloudGroupsRef = useRef<() => Promise<string[]>>(async () => [])
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
    (g: SupporterGroup): SupporterGroup =>
      stripDemoPresentationMedia({
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

  const refreshCloudGroups = useCallback(async (): Promise<string[]> => {
    if (!isSupabaseConfigured() || !userId) return []
    const sb = getSupabaseBrowserClient()
    if (!sb) return []
    const seq = ++cloudRefreshSeq.current
    const session = await ensureTalkFootSupabaseSession(sb)
    if (!session || seq !== cloudRefreshSeq.current) return []
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
    if (seq !== cloudRefreshSeq.current) return []
    setCloudGroups(cloud)

    const { data, error } = membersRes
    if (!error) {
      const cloudJoined = (data ?? [])
        .map((row) => row?.group_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
      setJoinedGroupIds(cloudJoined)
      persistJoined(cloudJoined)
      return cloudJoined
    }
    return []
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
    async (
      id: string,
    ): Promise<
      | { ok: true }
      | { ok: false; reason: string; limitKind?: 'join' | 'create' }
    > => {
      if (!userId) return { ok: false, reason: 'Connexion requise.' }
      const target = groups.find((g) => g.id === id)
      if (target) {
        const membersNow = memberCountsByGroupId.get(id) ?? target.members ?? 0
        const cap = canJoinGroupByMemberCap(membersNow, target.maxMembers)
        if (!cap.ok) {
          return {
            ok: false,
            reason: `Ce groupe est complet (${cap.limit} membres max pour cette tribune).`,
          }
        }
      }
      if (!joinedGroupIds.includes(id)) {
        const gate = canJoinGroup(tier, joinedGroupIds.length, isAdmin)
        if (!gate.ok && gate.limit != null) {
          return {
            ok: false,
            reason: joinGroupLimitMessage(tier, gate.limit, joinedGroupIds.length),
            limitKind: 'join',
          }
        }
      }

      const sb = getSupabaseBrowserClient()
      if (sb && isSupabaseConfigured()) {
        const cloudRes = await upsertCloudGroupMembership(sb, id)
        if (!cloudRes.ok) {
          if (cloudRes.code === 'subscription_join_limit') {
            const synced = await refreshCloudGroups()
            return {
              ok: false,
              reason: joinGroupLimitMessage(
                tier,
                plan.limits.maxGroupsJoined ?? 5,
                synced.length || joinedGroupIds.length,
              ),
              limitKind: 'join',
            }
          }
          return { ok: false, reason: cloudRes.error ?? 'Impossible de rejoindre ce groupe.' }
        }
      }

      setJoinedGroupIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id]
        persistJoined(next)
        return next
      })
      if (sb && isSupabaseConfigured()) {
        const ids = rawGroups.map((g) => g.id)
        void refreshMemberCounts(ids)
        void refreshGroupPresence(ids)
      }
      return { ok: true }
    },
    [
      userId,
      persistJoined,
      rawGroups,
      groups,
      memberCountsByGroupId,
      refreshMemberCounts,
      refreshGroupPresence,
      joinedGroupIds,
      isAdmin,
      tier,
      plan.limits.maxGroupsJoined,
      refreshCloudGroups,
    ],
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
    async (
      g: Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>,
    ): Promise<
      | { ok: true; group: SupporterGroup }
      | { ok: false; reason: string; limitKind?: 'join' | 'create' }
    > => {
      if (!userId) {
        return { ok: false, reason: 'Connexion requise pour créer une tribune.' }
      }
      const createdIds = new Set<string>()
      for (const g of custom) {
        if (g.createdBy === 'me') createdIds.add(g.id)
      }
      for (const g of cloudGroups) {
        if (g.createdBy === 'me') createdIds.add(g.id)
      }
      const gate = canCreateGroup(tier, createdIds.size, isAdmin)
      if (!gate.ok) {
        return {
          ok: false,
          reason: createGroupLimitMessage(tier, gate.limit),
          limitKind: 'create',
        }
      }
      const totalGate = canJoinGroup(tier, joinedGroupIds.length, isAdmin)
      if (!totalGate.ok && totalGate.limit != null) {
        return {
          ok: false,
          reason: joinGroupLimitMessage(tier, totalGate.limit, joinedGroupIds.length),
          limitKind: 'join',
        }
      }
      const id = `g-me-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const hashtags =
        g.hashtags?.length ? normalizeHashtagList(g.hashtags) : undefined
      const next: SupporterGroup = {
        ...g,
        id,
        createdBy: 'me',
        createdAt: new Date().toISOString(),
        maxMembers: groupMemberCapForTier(tier, isAdmin),
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
        const session = await ensureTalkFootSupabaseSession(sb)
        if (!session) {
          setCustom((prev) => {
            const rolled = prev.filter((g) => g.id !== id)
            persistCustom(rolled)
            return rolled
          })
          setJoinedGroupIds((prev) => {
            const rolled = prev.filter((gid) => gid !== id)
            persistJoined(rolled)
            return rolled
          })
          return { ok: false, reason: 'Session cloud indisponible. Réessaie.' }
        }
        setSupabaseActorId(session.user.id)
        const ownerClerkId = isClerkAuthMode() ? userId : null
        const reg = await upsertCloudSupporterGroup(sb, next, session.user.id, ownerClerkId)
        if (!reg.ok) {
          setCustom((prev) => {
            const rolled = prev.filter((g) => g.id !== id)
            persistCustom(rolled)
            return rolled
          })
          setJoinedGroupIds((prev) => {
            const rolled = prev.filter((gid) => gid !== id)
            persistJoined(rolled)
            return rolled
          })
          if (reg.code === 'subscription_create_limit') {
            return {
              ok: false,
              reason: createGroupLimitMessage(tier, gate.limit),
              limitKind: 'create',
            }
          }
          return { ok: false, reason: reg.error ?? 'Impossible de créer le groupe.' }
        }
        await upsertCloudGroupMembership(sb, id)
        await refreshCloudGroups()
      }
      return { ok: true, group: next }
    },
    [userId, isAdmin, persistCustom, persistJoined, refreshCloudGroups, custom, cloudGroups, tier, joinedGroupIds],
  )

  const byId = useCallback(
    (id: string) => groups.find((g) => g.id === id) ?? null,
    [groups],
  )

  const deleteGroup = useCallback(
    async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const target = groups.find((g) => g.id === id)
      if (!target || target.createdBy !== 'me') {
        return { ok: false, error: 'not_owner' }
      }

      const sb = getSupabaseBrowserClient()
      if (sb && isSupabaseConfigured()) {
        const session = await ensureTalkFootSupabaseSession(sb)
        if (!session) {
          return { ok: false, error: 'no_session' }
        }
        const del = await deleteCloudSupporterGroup(sb, id)
        if (!del.ok) {
          return { ok: false, error: del.error ?? 'cloud_delete_failed' }
        }
        await deleteCloudGroupMembership(sb, id)
      }

      setCustom((prev) => {
        const next = prev.filter((g) => g.id !== id)
        if (next.length !== prev.length) persistCustom(next)
        return next
      })
      setCloudGroups((prev) => prev.filter((g) => g.id !== id))
      setJoinedGroupIds((prev) => {
        const next = prev.filter((gid) => gid !== id)
        if (next.length !== prev.length) persistJoined(next)
        return next
      })
      removeCustomDebatesForGroup(id)

      if (sb && isSupabaseConfigured()) {
        await refreshCloudGroups()
      }

      return { ok: true }
    },
    [groups, persistCustom, persistJoined, refreshCloudGroups],
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

  const createdByMeCount = useMemo(() => {
    const ids = new Set<string>()
    for (const g of custom) {
      if (g.createdBy === 'me') ids.add(g.id)
    }
    for (const g of cloudGroups) {
      if (g.createdBy === 'me') ids.add(g.id)
    }
    return ids.size
  }, [custom, cloudGroups])

  const knownGroupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups])

  const orphanJoinedGroupIds = useMemo(
    () => joinedGroupIds.filter((id) => !knownGroupIds.has(id)),
    [joinedGroupIds, knownGroupIds],
  )

  const myJoinedGroups = useMemo(() => {
    const out: SupporterGroup[] = []
    for (const id of joinedGroupIds) {
      const g = groups.find((group) => group.id === id)
      if (g) out.push(g)
    }
    return out
  }, [joinedGroupIds, groups])

  return {
    groups,
    subscriptionTier: tier,
    groupLimits: {
      created: createdByMeCount,
      maxCreated: isAdmin ? null : plan.limits.maxGroupsCreated,
      joined: joinedGroupIds.length,
      maxJoined: isAdmin ? null : plan.limits.maxGroupsJoined,
    },
    myJoinedGroups,
    orphanJoinedGroupIds,
    createGroup,
    updateGroup,
    deleteGroup,
    byId,
    joinedGroupIds,
    joinGroup,
    leaveGroup,
    isJoined,
    refreshCloudGroups,
    refreshGroupActivity: refreshGroupActivityNow,
  }
}
