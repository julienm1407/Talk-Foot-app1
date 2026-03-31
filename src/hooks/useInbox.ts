import { useCallback, useMemo } from 'react'
import { buildInboxSeed } from '../data/inboxSeed'
import type { InboxItem } from '../types/inbox'
import { useLocalStorageState } from './useLocalStorage'

const REMOVED_KEY = 'talkfoot.inbox.removed.v1'
const READ_KEY = 'talkfoot.inbox.read.v1'

const isStringArray = (p: unknown): p is string[] => Array.isArray(p) && p.every((x) => typeof x === 'string')

export function useInbox() {
  const [removedIds, setRemovedIds] = useLocalStorageState<string[]>(REMOVED_KEY, [], isStringArray)
  const [readIds, setReadIds] = useLocalStorageState<string[]>(READ_KEY, [], isStringArray)

  const all = useMemo(() => buildInboxSeed(), [])

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
  }, [items, setReadIds])

  const byKind = useMemo(() => {
    const news = items.filter((i): i is Extract<InboxItem, { kind: 'news' }> => i.kind === 'news')
    const invites = items.filter((i): i is Extract<InboxItem, { kind: 'invite' }> => i.kind === 'invite')
    const friends = items.filter((i): i is Extract<InboxItem, { kind: 'friend' }> => i.kind === 'friend')
    return { news, invites, friends }
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
