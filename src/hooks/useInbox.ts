import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { buildInboxSeed } from '../data/inboxSeed'
import { useArticles } from '../contexts/ArticlesContext'
import { useCloudFriends } from './useCloudFriends'
import type { InboxFriendItem, InboxItem, InboxLikeItem } from '../types/inbox'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  fetchInboxNotificationsForRecipient,
  markInboxNotificationRead,
} from '../lib/supabase/inboxNotifications'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { postgresChangesEqFilter } from '../lib/supabase/realtimeEqFilter'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import { useLocalStorageState } from './useLocalStorage'

const REMOVED_KEY = 'talkfoot.inbox.removed.v1'
const READ_KEY = 'talkfoot.inbox.read.v1'

const isStringArray = (p: unknown): p is string[] => Array.isArray(p) && p.every((x) => typeof x === 'string')

function pendingFriendInboxItems(
  incoming: { requesterId: string; displayName: string }[],
  existingRequesterIds: Set<string>,
): InboxFriendItem[] {
  const now = Date.now()
  return incoming
    .filter((r) => !existingRequesterIds.has(r.requesterId))
    .map((r) => ({
      kind: 'friend' as const,
      id: `friend-pending-${r.requesterId}`,
      requesterId: r.requesterId,
      displayName: r.displayName,
      href: `/user/${r.requesterId}`,
      createdAtLabel: 'En attente',
      createdAtMs: now,
    }))
}

export function useInbox() {
  const { user: authUser } = useAuth()
  const cloudFriends = useCloudFriends()
  const [removedIds, setRemovedIds] = useLocalStorageState<string[]>(REMOVED_KEY, [], isStringArray)
  const [readIds, setReadIds] = useLocalStorageState<string[]>(READ_KEY, [], isStringArray)
  const [cloudNotifs, setCloudNotifs] = useState<InboxItem[]>([])
  const recipientRef = useRef<string | null>(null)

  const { articles } = useArticles()
  const seed = useMemo(() => buildInboxSeed(articles), [articles])

  const refreshCloudNotifs = useCallback(async () => {
    if (!isSupabaseConfigured() || !authUser?.id || authUser.isAnonymous) {
      setCloudNotifs([])
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const session = await ensureTalkFootSupabaseSession(sb)
    if (!session) return
    recipientRef.current = session.user.id
    await syncRealtimeAuth(sb)
    const rows = await fetchInboxNotificationsForRecipient(sb, session.user.id)
    setCloudNotifs(rows)
  }, [authUser?.id, authUser?.isAnonymous])

  useEffect(() => {
    void refreshCloudNotifs()
  }, [refreshCloudNotifs])

  useEffect(() => {
    void refreshCloudNotifs()
  }, [cloudFriends.incomingPendingFrom, refreshCloudNotifs])

  useEffect(() => {
    if (!isSupabaseConfigured() || !authUser?.id || authUser.isAnonymous) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    const mountId = Date.now()

    const run = async () => {
      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session || cancelled) return
      recipientRef.current = session.user.id
      await syncRealtimeAuth(sb)
      await refreshCloudNotifs()
      if (cancelled) return

      const recipientFilter = postgresChangesEqFilter(
        'recipient_supabase_id',
        session.user.id,
      )
      const channel = sb
        .channel(`inbox_notifs:${session.user.id}:${mountId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inbox_notifications',
            filter: recipientFilter,
          },
          () => {
            void refreshCloudNotifs()
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] inbox_notifications realtime:', status)
          }
          if (status === 'SUBSCRIBED') void refreshCloudNotifs()
        })

      if (cancelled) {
        void sb.removeChannel(channel)
        return
      }
      return channel
    }

    let channel: ReturnType<typeof sb.channel> | undefined
    void run().then((ch) => {
      channel = ch
    })

    return () => {
      cancelled = true
      if (channel) void sb.removeChannel(channel)
    }
  }, [authUser?.id, authUser?.isAnonymous, refreshCloudNotifs])

  /** Filet si le realtime inbox rate (onglet en fond, auth lag) — likes / amis sans refresh manuel. */
  useEffect(() => {
    if (!isSupabaseConfigured() || !authUser?.id || authUser.isAnonymous) return

    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshCloudNotifs()
    }
    const onFocus = () => void refreshCloudNotifs()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshCloudNotifs()
    }, 12_000)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(pollId)
    }
  }, [authUser?.id, authUser?.isAnonymous, refreshCloudNotifs])

  const all = useMemo(() => {
    const fromCloud = cloudNotifs
    const friendFromInbox = fromCloud.filter((i): i is InboxFriendItem => i.kind === 'friend')
    const inboxRequesterIds = new Set(friendFromInbox.map((f) => f.requesterId))
    const pendingFriends = pendingFriendInboxItems(
      cloudFriends.incomingPendingFrom,
      inboxRequesterIds,
    )
    const merged: InboxItem[] = [...fromCloud, ...pendingFriends, ...seed]
    return merged.sort((a, b) => {
      // Demandes d'amis toujours au-dessus des likes / actus.
      const rank = (i: InboxItem) =>
        i.kind === 'friend' ? 0 : i.kind === 'like' ? 1 : i.kind === 'invite' ? 2 : 3
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      const ta = a.kind === 'like' || a.kind === 'friend' ? a.createdAtMs : 0
      const tb = b.kind === 'like' || b.kind === 'friend' ? b.createdAtMs : 0
      if (ta !== tb) return tb - ta
      return 0
    })
  }, [cloudNotifs, cloudFriends.incomingPendingFrom, seed])

  const items = useMemo(
    () => all.filter((i) => !removedIds.includes(i.id)),
    [all, removedIds],
  )

  const unreadCount = useMemo(
    () => items.filter((i) => !readIds.includes(i.id)).length,
    [items, readIds],
  )

  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      const sb = getSupabaseBrowserClient()
      if (sb && recipientRef.current && !id.startsWith('friend-pending-')) {
        void markInboxNotificationRead(sb, id)
      }
    },
    [setReadIds],
  )

  const remove = useCallback(
    (id: string) => {
      setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
    [setRemovedIds],
  )

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      items.forEach((i) => next.add(i.id))
      return [...next]
    })
    const sb = getSupabaseBrowserClient()
    if (sb && recipientRef.current) {
      for (const n of cloudNotifs) {
        if (n.kind === 'like' || n.kind === 'friend') {
          if (!n.id.startsWith('friend-pending-')) {
            void markInboxNotificationRead(sb, n.id)
          }
        }
      }
    }
  }, [items, setReadIds, cloudNotifs])

  const byKind = useMemo(() => {
    const likes = items.filter((i): i is InboxLikeItem => i.kind === 'like')
    const news = items.filter((i): i is Extract<InboxItem, { kind: 'news' }> => i.kind === 'news')
    const invites = items.filter((i): i is Extract<InboxItem, { kind: 'invite' }> => i.kind === 'invite')
    const friends = items.filter((i): i is InboxFriendItem => i.kind === 'friend')
    return { likes, news, invites, friends }
  }, [items])

  return {
    items,
    byKind,
    unreadCount,
    isRead: (id: string) => readIds.includes(id),
    markRead,
    remove,
    markAllRead,
    refresh: refreshCloudNotifs,
  }
}

export type UseInboxReturn = ReturnType<typeof useInbox>
