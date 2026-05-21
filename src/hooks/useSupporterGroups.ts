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
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { ensureTalkFootSupabaseSession, isClerkAuthMode } from '../lib/supabase/talkfootSession'
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
  const [supabaseActorId, setSupabaseActorId] = useState<string | null>(null)
  const cloudRefreshSeq = useRef(0)
  const refreshCloudGroupsRef = useRef<() => Promise<void>>(async () => {})
  const realtimeMountSeq = useRef(0)

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

  const enrichChannels = useCallback(
    (g: SupporterGroup): SupporterGroup => ({
      ...g,
      channels: channelsForSupporterGroup(g.channels),
    }),
    [],
  )

  const groups = useMemo(() => {
    const byId = new Map<string, SupporterGroup>()
    for (const g of starterGroups) byId.set(g.id, enrichChannels(g))
    for (const g of cloudGroups) byId.set(g.id, enrichChannels(g))
    for (const g of custom) byId.set(g.id, enrichChannels(g))
    return Array.from(byId.values()).sort((a, b) => b.intensity - a.intensity)
  }, [custom, cloudGroups, enrichChannels])

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
  }
}
