import { useCallback, useMemo } from 'react'
import { useLocalStorageState } from './useLocalStorage'
import type { Message, User } from '../types/chat'
import type { Match } from '../types/match'

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

const defaultLikes: Record<string, LikeRecord> = {
  'msg-2': {
    count: 12,
    userIds: ['u-1', 'u-2', 'u-3', 'u-4', 'u-5', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
  },
  'msg-d3': {
    count: 8,
    userIds: ['u-1', 'u-2', 'u-3', 'u-4', 'a', 'b', 'c', 'd'],
  },
}
const defaultTop: TopComment[] = [
  {
    id: 'msg-2',
    matchId: 'm-rma-fcb',
    matchLabel: 'RMA - FCB',
    userId: 'u-1',
    username: 'UltraNuit',
    text: 'Le stade est en feu, on entend tout même à la TV.',
    likes: 12,
    createdAt: Date.now() - 180_000,
  },
  {
    id: 'msg-d3',
    matchId: 'm-demo-live',
    matchLabel: 'PSG - OM',
    userId: 'u-4',
    username: 'RagePress',
    text: 'Quel but de #9 à la 23e, quelle frappe.',
    likes: 8,
    createdAt: Date.now() - 120_000,
  },
]

const isLikeRecordMap = (p: unknown) =>
  p !== null && typeof p === 'object' && !Array.isArray(p)

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
