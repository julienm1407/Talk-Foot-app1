import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  createLiveMatchMessageLikeInboxNotification,
} from '../lib/supabase/inboxNotifications'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { postgresChangesEqFilter } from '../lib/supabase/realtimeEqFilter'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { displayNameFromSession } from './useLiveMatchChatSync'

type LikeRow = {
  message_id: string
  user_id: string
}

function likeRowFromPayload(row: unknown): LikeRow | null {
  if (!row || typeof row !== 'object') return null
  const o = row as Record<string, unknown>
  const message_id = o.message_id
  const user_id = o.user_id
  if (typeof message_id !== 'string' || typeof user_id !== 'string') return null
  return { message_id, user_id }
}

export type MessageLikeState = {
  likes: number
  likedByMe: boolean
}

const EMPTY_LIKE: MessageLikeState = { likes: 0, likedByMe: false }

function buildLikeMap(rows: LikeRow[], viewerUserId: string | null): Map<string, MessageLikeState> {
  const byMessage = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!byMessage.has(row.message_id)) byMessage.set(row.message_id, new Set())
    byMessage.get(row.message_id)!.add(row.user_id)
  }
  const out = new Map<string, MessageLikeState>()
  for (const [messageId, userIds] of byMessage) {
    out.set(messageId, {
      likes: userIds.size,
      likedByMe: viewerUserId ? userIds.has(viewerUserId) : false,
    })
  }
  return out
}

export function useLiveMatchMessageLikesSync(options: {
  matchId: string
  enabled: boolean
  userId: string | null
  actorDisplayName?: string | null
  matchLabel?: string | null
}) {
  const { matchId, enabled, userId, actorDisplayName, matchLabel } = options
  const [likeMap, setLikeMap] = useState<Map<string, MessageLikeState>>(() => new Map())
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  const getLikeState = useCallback(
    (messageId: string): MessageLikeState => likeMap.get(messageId) ?? EMPTY_LIKE,
    [likeMap],
  )

  const applyRows = useCallback((rows: LikeRow[]) => {
    setLikeMap(buildLikeMap(rows, userIdRef.current))
  }, [])

  const patchMessageLike = useCallback((messageId: string, liked: boolean) => {
    const uid = userIdRef.current
    if (!uid) return
    setLikeMap((prev) => {
      const next = new Map(prev)
      const cur = next.get(messageId) ?? { ...EMPTY_LIKE }
      if (liked) {
        if (cur.likedByMe) return prev
        next.set(messageId, { likes: cur.likes + 1, likedByMe: true })
      } else {
        if (!cur.likedByMe) return prev
        next.set(messageId, {
          likes: Math.max(0, cur.likes - 1),
          likedByMe: false,
        })
      }
      return next
    })
  }, [])

  const notifyAuthorOnLike = useCallback(
    async (messageId: string, likerDisplayName: string) => {
      if (!isSupabaseConfigured() || !matchId) return
      const sb = getSupabaseBrowserClient()
      if (!sb) return
      const { data: msg } = await sb
        .from('live_match_messages')
        .select('user_id, body, metadata')
        .eq('id', messageId)
        .maybeSingle()
      const authorId = msg?.user_id
      const uid = userIdRef.current
      if (!authorId || !uid || authorId === uid) return
      const meta =
        msg?.metadata && typeof msg.metadata === 'object' && !Array.isArray(msg.metadata)
          ? (msg.metadata as Record<string, unknown>)
          : null
      const textBody = typeof msg?.body === 'string' ? msg.body.trim() : ''
      const messagePreview = textBody || (typeof meta?.gifUrl === 'string' ? '[GIF]' : '')
      await createLiveMatchMessageLikeInboxNotification(sb, {
        recipientSupabaseId: authorId,
        actorDisplayName: likerDisplayName,
        matchId,
        matchLabel: matchLabel?.trim() || undefined,
        messageId,
        messagePreview,
      })
    },
    [matchId, matchLabel],
  )

  const toggleLike = useCallback(
    async (messageId: string) => {
      if (!isSupabaseConfigured() || !matchId) return
      const sb = getSupabaseBrowserClient()
      if (!sb) return
      const session = await ensureSupabaseChatSession(sb)
      if (!session) return

      const uid = session.user.id
      userIdRef.current = userIdRef.current ?? uid
      let willLike = false
      setLikeMap((prev) => {
        const cur = prev.get(messageId) ?? EMPTY_LIKE
        willLike = !cur.likedByMe
        return prev
      })
      patchMessageLike(messageId, willLike)

      const likerName =
        actorDisplayName?.trim() || displayNameFromSession(session.user)

      if (willLike) {
        const { error } = await sb.from('live_match_message_likes').insert({
          match_id: matchId,
          message_id: messageId,
          user_id: uid,
        })
        if (error) {
          patchMessageLike(messageId, false)
          if (import.meta.env.DEV) console.warn('[Talk Foot] like insert:', error.message)
          return
        }
        void notifyAuthorOnLike(messageId, likerName)
      } else {
        const { error } = await sb
          .from('live_match_message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', uid)
        if (error) {
          patchMessageLike(messageId, true)
          if (import.meta.env.DEV) console.warn('[Talk Foot] like delete:', error.message)
        }
      }
    },
    [matchId, actorDisplayName, patchMessageLike, notifyAuthorOnLike],
  )

  useEffect(() => {
    if (!enabled || !matchId || !isSupabaseConfigured()) {
      setLikeMap(new Map())
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    const mountId = Date.now()
    const channelRef: { current: ReturnType<typeof sb.channel> | null } = { current: null }

    const onRowChange = (messageId: string, userIdRow: string, added: boolean) => {
      setLikeMap((prev) => {
        const next = new Map(prev)
        const cur = next.get(messageId) ?? { ...EMPTY_LIKE }
        const viewerId = userIdRef.current
        if (added) {
          if (viewerId && userIdRow === viewerId && cur.likedByMe) return prev
          next.set(messageId, {
            likes: cur.likes + 1,
            likedByMe: viewerId ? cur.likedByMe || userIdRow === viewerId : cur.likedByMe,
          })
        } else {
          if (viewerId && userIdRow === viewerId && !cur.likedByMe) return prev
          if (cur.likes <= 0) return prev
          next.set(messageId, {
            likes: Math.max(0, cur.likes - 1),
            likedByMe: viewerId ? cur.likedByMe && userIdRow !== viewerId : cur.likedByMe,
          })
        }
        return next
      })
    }

    const run = async () => {
      const session = await ensureSupabaseChatSession(sb)
      if (!session || cancelled) return
      userIdRef.current = userIdRef.current ?? session.user.id
      await syncRealtimeAuth(sb)

      const { data: rows, error: fetchErr } = await sb
        .from('live_match_message_likes')
        .select('message_id, user_id')
        .eq('match_id', matchId)
        .limit(5000)

      if (!cancelled && !fetchErr && rows?.length) {
        applyRows(rows as LikeRow[])
      }

      if (cancelled) return

      const matchFilter = postgresChangesEqFilter('match_id', matchId)
      const channel = sb
        .channel(`live_match_likes:${matchId}:${mountId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'live_match_message_likes',
            filter: matchFilter,
          },
          (payload: RealtimePostgresChangesPayload<LikeRow>) => {
            const row = likeRowFromPayload(payload.new)
            if (!row) return
            onRowChange(row.message_id, row.user_id, true)
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'live_match_message_likes',
            filter: matchFilter,
          },
          (payload: RealtimePostgresChangesPayload<LikeRow>) => {
            const row = likeRowFromPayload(payload.old)
            if (!row) return
            onRowChange(row.message_id, row.user_id, false)
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] live_match_message_likes realtime:', status)
          }
        })

      if (cancelled) {
        void sb.removeChannel(channel)
        return
      }
      channelRef.current = channel
    }

    void run()

    return () => {
      cancelled = true
      if (channelRef.current) {
        void sb.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [applyRows, enabled, matchId])

  useEffect(() => {
    if (!enabled || !matchId || !isSupabaseConfigured()) return
    void (async () => {
      const sb = getSupabaseBrowserClient()
      if (!sb) return
      const session = await ensureSupabaseChatSession(sb)
      if (!session) return
      const { data: rows } = await sb
        .from('live_match_message_likes')
        .select('message_id, user_id')
        .eq('match_id', matchId)
        .limit(5000)
      applyRows((rows ?? []) as LikeRow[])
    })()
  }, [applyRows, enabled, matchId, userId])

  return {
    getLikeState,
    toggleLike,
    isConfigured: isSupabaseConfigured(),
  }
}
