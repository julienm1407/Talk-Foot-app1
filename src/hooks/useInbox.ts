import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { buildInboxSeed } from '../data/inboxSeed'
import type { InboxItem, InboxLikeItem } from '../types/inbox'
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

export function useInbox() {
  const { user: authUser } = useAuth()
  const [removedIds, setRemovedIds] = useLocalStorageState<string[]>(REMOVED_KEY, [], isStringArray)
  const [readIds, setReadIds] = useLocalStorageState<string[]>(READ_KEY, [], isStringArray)
  const [likeNotifs, setLikeNotifs] = useState<InboxLikeItem[]>([])
  const recipientRef = useRef<string | null>(null)

  const seed = useMemo(() => buildInboxSeed(), [])

  const refreshLikeNotifs = useCallback(async () => {
    if (!isSupabaseConfigured() || !authUser?.id || authUser.isAnonymous) {
      setLikeNotifs([])
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const session = await ensureTalkFootSupabaseSession(sb)
    if (!session) return
    recipientRef.current = session.user.id
    await syncRealtimeAuth(sb)
    const rows = await fetchInboxNotificationsForRecipient(sb, session.user.id)
    setLikeNotifs(rows)
  }, [authUser?.id, authUser?.isAnonymous])

  useEffect(() => {
    void refreshLikeNotifs()
  }, [refreshLikeNotifs])

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
      await refreshLikeNotifs()
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
            event: 'INSERT',
            schema: 'public',
            table: 'inbox_notifications',
            filter: recipientFilter,
          },
          () => {
            void refreshLikeNotifs()
          },
        )
        .subscribe()

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
  }, [authUser?.id, authUser?.isAnonymous, refreshLikeNotifs])

  const all = useMemo(() => {
    const merged: InboxItem[] = [...likeNotifs, ...seed]
    return merged.sort((a, b) => {
      const ta = a.kind === 'like' ? a.createdAtMs : 0
      const tb = b.kind === 'like' ? b.createdAtMs : 0
      if (ta !== tb) return tb - ta
      return 0
    })
  }, [likeNotifs, seed])

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
      if (sb && recipientRef.current) {
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
      for (const n of likeNotifs) {
        void markInboxNotificationRead(sb, n.id)
      }
    }
  }, [items, setReadIds, likeNotifs])

  const byKind = useMemo(() => {
    const likes = items.filter((i): i is InboxLikeItem => i.kind === 'like')
    const news = items.filter((i): i is Extract<InboxItem, { kind: 'news' }> => i.kind === 'news')
    const invites = items.filter((i): i is Extract<InboxItem, { kind: 'invite' }> => i.kind === 'invite')
    const friends = items.filter((i): i is Extract<InboxItem, { kind: 'friend' }> => i.kind === 'friend')
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
  }
}

export type UseInboxReturn = ReturnType<typeof useInbox>
