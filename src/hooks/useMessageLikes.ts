import { useCallback, useEffect, useMemo } from 'react'
import { useLocalStorageState } from './useLocalStorage'
import type { Message, User } from '../types/chat'
import type { Match } from '../types/match'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

const LIKES_KEY = 'talkfoot.messageLikes.v1'
const TOP_COMMENTS_KEY = 'talkfoot.topComments.v1'

type LikeRecord = { count: number; userIds: string[] }

export type TopComment = {
  id: string
  matchId: string
  matchLabel: string
  userId: string
  username: string
  text: string
  likes: number
  createdAt: number
}

const defaultLikes: Record<string, LikeRecord> = {}
const defaultTop: TopComment[] = []
const LEGACY_FAKE_COMMENT_IDS = new Set(['msg-2', 'msg-d3'])

const isLikeRecordMap = (p: unknown) =>
  p !== null && typeof p === 'object' && !Array.isArray(p)

type LiveLikeRow = {
  message_id: string
  user_id: string
  live_match_messages: {
    id: string
    match_id: string
    display_name: string
    body: string
    created_at: string
  }[]
}

function toCloudTopComments(rows: LiveLikeRow[]): TopComment[] {
  const byMessage = new Map<
    string,
    {
      users: Set<string>
      row: LiveLikeRow['live_match_messages'][number]
    }
  >()
  for (const row of rows) {
    const msg = row.live_match_messages?.[0]
    if (!msg) continue
    const existing = byMessage.get(row.message_id)
    if (existing) {
      existing.users.add(row.user_id)
      continue
    }
    byMessage.set(row.message_id, {
      users: new Set([row.user_id]),
      row: msg,
    })
  }
  return [...byMessage.entries()]
    .map(([messageId, data]) => ({
      id: messageId,
      matchId: data.row.match_id,
      matchLabel: 'Match',
      userId: 'supabase-user',
      username: data.row.display_name?.trim() || 'Supporteur',
      text: data.row.body,
      likes: data.users.size,
      createdAt: new Date(data.row.created_at).getTime() || Date.now(),
    }))
    .sort((a, b) => (b.likes !== a.likes ? b.likes - a.likes : b.createdAt - a.createdAt))
    .slice(0, 50)
}

export function useMessageLikes() {
  const [likesByMsg, setLikesByMsg] = useLocalStorageState<Record<string, LikeRecord>>(
    LIKES_KEY,
    defaultLikes,
    isLikeRecordMap,
  )
  const [topComments, setTopComments] = useLocalStorageState<TopComment[]>(
    TOP_COMMENTS_KEY,
    defaultTop,
    Array.isArray,
  )

  // Nettoie les anciens commentaires "seed" pour n'afficher que du vrai contenu.
  useEffect(() => {
    setTopComments((prev) => prev.filter((c) => !LEGACY_FAKE_COMMENT_IDS.has(c.id)))
    setLikesByMsg((prev) => {
      const next = { ...prev }
      LEGACY_FAKE_COMMENT_IDS.forEach((id) => {
        delete next[id]
      })
      return next
    })
  }, [setTopComments, setLikesByMsg])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    const channelRef: { current: ReturnType<typeof sb.channel> | null } = { current: null }

    const refreshCloudTop = async () => {
      const { data, error } = await sb
        .from('live_match_message_likes')
        .select(
          'message_id, user_id, live_match_messages!inner(id, match_id, display_name, body, created_at)',
        )
        .order('created_at', { foreignTable: 'live_match_messages', ascending: false })
        .limit(4000)
      if (cancelled || error || !data) return
      const fromCloud = toCloudTopComments(data as LiveLikeRow[])
      if (fromCloud.length > 0) {
        setTopComments(fromCloud)
      }
    }

    const run = async () => {
      await refreshCloudTop()
      if (cancelled) return

      // Canal unique par montage (évite le conflit Strict Mode / même topic déjà subscribe).
      const channel = sb
        .channel(`home-top-comments:${crypto.randomUUID()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'live_match_message_likes' },
          () => {
            void refreshCloudTop()
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'live_match_message_likes' },
          () => {
            void refreshCloudTop()
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] home-top-comments realtime:', status)
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
  }, [setTopComments])

  const getLikes = useCallback(
    (messageId: string) => likesByMsg[messageId]?.count ?? 0,
    [likesByMsg],
  )

  const hasLiked = useCallback(
    (messageId: string, userId: string) =>
      likesByMsg[messageId]?.userIds.includes(userId) ?? false,
    [likesByMsg],
  )

  const like = useCallback(
    (
      messageId: string,
      message: Message,
      match: Match | null,
      user: User | null,
    ) => {
      const rec = likesByMsg[messageId] ?? { count: 0, userIds: [] }
      if (rec.userIds.includes('me')) return // déjà liké
      const next = {
        count: rec.count + 1,
        userIds: [...rec.userIds, 'me'],
      }
      setLikesByMsg((prev) => ({ ...prev, [messageId]: next }))

      const matchLabel = match
        ? `${match.home.shortName} - ${match.away.shortName}`
        : 'Match'
      const entry: TopComment = {
        id: messageId,
        matchId: message.matchId,
        matchLabel,
        userId: message.userId,
        username: user?.username ?? 'Anon',
        text: message.text,
        likes: next.count,
        createdAt: message.createdAt,
      }
      setTopComments((prev) => {
        const filtered = prev.filter((c) => c.id !== messageId)
        return [...filtered, entry]
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 50)
      })
    },
    [likesByMsg, setLikesByMsg, setTopComments],
  )

  const unlike = useCallback(
    (messageId: string) => {
      const rec = likesByMsg[messageId]
      if (!rec?.userIds.includes('me')) return
      const next =
        rec.count <= 1
          ? { count: 0, userIds: [] }
          : { count: rec.count - 1, userIds: rec.userIds.filter((id) => id !== 'me') }
      setLikesByMsg((prev) => {
        const copy = { ...prev }
        if (next.count === 0) delete copy[messageId]
        else copy[messageId] = next
        return copy
      })
      setTopComments((prev) => {
        const filtered = prev.filter((c) => c.id !== messageId)
        const updated = prev.find((c) => c.id === messageId)
        if (updated && next.count > 0)
          return [...filtered, { ...updated, likes: next.count }]
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 50)
        return filtered
      })
    },
    [likesByMsg, setLikesByMsg, setTopComments],
  )

  const sortedTopComments = useMemo(
    () => [...topComments].sort((a, b) => b.likes - a.likes),
    [topComments],
  )

  return {
    getLikes,
    hasLiked,
    like,
    unlike,
    topComments: sortedTopComments,
  }
}
