import { useCallback, useEffect, useMemo, useState } from 'react'
import { mockDirectMessagesByThread, TALKFOOT_BOT_DM_THREAD_ID } from '../data/directMessagesMock'
import type { DirectMessageLine } from '../data/directMessagesMock'
import { pickTalkFootBotReply } from '../lib/talkFootBotReplies'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { cloudPrivateThreadKey } from '../utils/cloudDmThread'
import { useAuth } from '../contexts/AuthContext'
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

function rowToDmLine(row: { id: string; sender_id: string; body: string; created_at: string }, myAuthId: string): DirectMessageLine {
  const t = new Date(row.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return {
    id: row.id,
    fromMe: row.sender_id === myAuthId,
    body: row.body,
    atLabel: t,
  }
}

export function useDirectMessages(activeUiThreadId: string | null) {
  const { user: authUser } = useAuth()
  const myAuthId = authUser?.id
  const [userByThread, setUserByThread] = useLocalStorageState<Record<string, DirectMessageLine[]>>(
    KEY_MESSAGES,
    {},
    isUserDmStore,
  )
  const [visitedIds, setVisitedIds] = useLocalStorageState<string[]>(KEY_VISITED, [], isStringArray)
  const [cloudByKey, setCloudByKey] = useState<Record<string, DirectMessageLine[]>>({})

  const cloudKeyForActive = useMemo(
    () =>
      activeUiThreadId && myAuthId ? cloudPrivateThreadKey(activeUiThreadId, myAuthId) : null,
    [activeUiThreadId, myAuthId],
  )

  useEffect(() => {
    if (!cloudKeyForActive || !isSupabaseConfigured()) return

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    let ch: ReturnType<typeof sb.channel> | null = null

    const run = async () => {
      const session = await ensureSupabaseChatSession(sb)
      if (!session || cancelled) return
      await syncRealtimeAuth(sb)
      const myId = session.user.id

      const { data: rows, error: fetchErr } = await sb
        .from('private_messages')
        .select('id, sender_id, body, created_at')
        .eq('thread_key', cloudKeyForActive)
        .order('created_at', { ascending: true })
        .limit(200)

      if (!cancelled && !fetchErr && rows?.length) {
        setCloudByKey((prev) => ({
          ...prev,
          [cloudKeyForActive]: (rows as { id: string; sender_id: string; body: string; created_at: string }[]).map(
            (r) => rowToDmLine(r, myId),
          ),
        }))
      }

      if (cancelled) return

      ch = sb
        .channel(`private_dm:${cloudKeyForActive}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `thread_key=eq.${cloudKeyForActive}`,
          },
          (payload) => {
            const row = payload.new as { id?: string; sender_id?: string; body?: string; created_at?: string }
            if (!row?.id || !row.sender_id || row.body == null || !row.created_at) return
            const line = rowToDmLine(row as Required<typeof row>, myId)
            setCloudByKey((prev) => {
              const cur = prev[cloudKeyForActive] ?? []
              if (cur.some((x) => x.id === line.id)) return prev
              return { ...prev, [cloudKeyForActive]: [...cur, line] }
            })
          },
        )
        .subscribe()
    }

    void run()

    return () => {
      cancelled = true
      if (ch) void sb.removeChannel(ch)
    }
  }, [cloudKeyForActive])

  const mergedFor = useCallback(
    (threadId: string) => {
      const seed = mockDirectMessagesByThread[threadId] ?? []
      const local = userByThread[threadId] ?? []
      const ck = cloudPrivateThreadKey(threadId, myAuthId)
      if (ck) {
        const cloud = cloudByKey[ck] ?? []
        const botLocal = local.filter((m) => !m.fromMe)
        return [...seed, ...cloud, ...botLocal]
      }
      return [...seed, ...local]
    },
    [userByThread, cloudByKey, myAuthId],
  )

  const send = useCallback(
    (threadId: string, body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return

      const ck = cloudPrivateThreadKey(threadId, myAuthId)
      const pushBotReply = () => {
        if (threadId !== TALKFOOT_BOT_DM_THREAD_ID) return
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

      if (ck && isSupabaseConfigured()) {
        void (async () => {
          const sb = getSupabaseBrowserClient()
          if (!sb) return
          const session = await ensureSupabaseChatSession(sb)
          if (!session) return
          const { data, error } = await sb
            .from('private_messages')
            .insert({
              thread_key: ck,
              sender_id: session.user.id,
              body: trimmed,
            })
            .select('id, sender_id, body, created_at')
            .single()
          if (error || !data) {
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
            pushBotReply()
            return
          }
          const line = rowToDmLine(data as { id: string; sender_id: string; body: string; created_at: string }, session.user.id)
          setCloudByKey((prev) => {
            const cur = prev[ck] ?? []
            if (cur.some((x) => x.id === line.id)) return prev
            return { ...prev, [ck]: [...cur, line] }
          })
          pushBotReply()
        })()
        return
      }

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
      pushBotReply()
    },
    [setUserByThread, myAuthId],
  )

  const markVisited = useCallback(
    (threadId: string) => {
      setVisitedIds((prev) => (prev.includes(threadId) ? prev : [...prev, threadId]))
    },
    [setVisitedIds],
  )

  return useMemo(
    () => ({ mergedFor, send, visitedIds, markVisited }),
    [mergedFor, send, visitedIds, markVisited],
  )
}
