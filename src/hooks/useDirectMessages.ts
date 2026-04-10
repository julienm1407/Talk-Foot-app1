import { useCallback } from 'react'
import { mockDirectMessagesByThread, TALKFOOT_BOT_DM_THREAD_ID } from '../data/directMessagesMock'
import type { DirectMessageLine } from '../data/directMessagesMock'
import { pickTalkFootBotReply } from '../lib/talkFootBotReplies'
import { useLocalStorageState } from './useLocalStorage'

const KEY_MESSAGES = 'talkfoot.dm.userMessages.v1'
const KEY_VISITED = 'talkfoot.dm.visitedThreads.v1'

function isUserDmStore(x: unknown): x is Record<string, DirectMessageLine[]> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  for (const v of Object.values(x as Record<string, unknown>)) {
    if (!Array.isArray(v)) return false
    for (const item of v) {
      if (!item || typeof item !== 'object') return false
      const m = item as Record<string, unknown>
      if (typeof m.id !== 'string' || typeof m.body !== 'string') return false
      if (typeof m.fromMe !== 'boolean' || typeof m.atLabel !== 'string') return false
    }
  }
  return true
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === 'string')
}

export function useDirectMessages() {
  const [userByThread, setUserByThread] = useLocalStorageState<Record<string, DirectMessageLine[]>>(
    KEY_MESSAGES,
    {},
    isUserDmStore,
  )
  const [visitedIds, setVisitedIds] = useLocalStorageState<string[]>(KEY_VISITED, [], isStringArray)

  const mergedFor = useCallback(
    (threadId: string) => {
      const seed = mockDirectMessagesByThread[threadId] ?? []
      return [...seed, ...(userByThread[threadId] ?? [])]
    },
    [userByThread],
  )

  const send = useCallback(
    (threadId: string, body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return
      const line: DirectMessageLine = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fromMe: true,
        body: trimmed,
        atLabel: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }
      setUserByThread((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] ?? []), line],
      }))

      if (threadId === TALKFOOT_BOT_DM_THREAD_ID) {
        const delayMs = 650 + Math.floor(Math.random() * 450)
        window.setTimeout(() => {
          const reply: DirectMessageLine = {
            id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            fromMe: false,
            body: pickTalkFootBotReply(trimmed),
            atLabel: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          }
          setUserByThread((prev) => ({
            ...prev,
            [threadId]: [...(prev[threadId] ?? []), reply],
          }))
        }, delayMs)
      }
    },
    [setUserByThread],
  )

  const markVisited = useCallback(
    (threadId: string) => {
      setVisitedIds((prev) => (prev.includes(threadId) ? prev : [...prev, threadId]))
    },
    [setVisitedIds],
  )

  return { mergedFor, send, visitedIds, markVisited }
}
