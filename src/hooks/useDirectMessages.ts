import { useCallback, useEffect, useMemo, useState } from 'react'
import { TALKFOOT_BOT_DM_THREAD_ID } from '../data/directMessageConstants'
import { mockDirectMessagesByThread } from '../data/directMessagesMock'
import type { DirectMessageLine } from '../data/directMessagesMock'
import { pickTalkFootBotReply } from '../lib/talkFootBotReplies'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { cloudPrivateThreadKey } from '../utils/cloudDmThread'
import { useAuth } from '../contexts/AuthContext'
import { useLocalStorageState } from './useLocalStorage'
import { isSupabaseModerationError, moderateChatText } from '../utils/bannedWords'

const KEY_MESSAGES = 'talkfoot.dm.userMessages.v1'
const KEY_VISITED = 'talkfoot.dm.visitedThreads.v1'
const KEY_LAST_READ = 'talkfoot.dm.lastReadMessageByThread.v1'

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

function isLastReadStore(x: unknown): x is Record<string, string> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  return Object.values(x as Record<string, unknown>).every((v) => typeof v === 'string')
}

const EMPTY_THREAD_READ = '__empty__'

function rowToDmLine(row: { id: string; sender_id: string; body: string; created_at: string }, myAuthId: string): DirectMessageLine {
  const t = new Date(row.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return {
    id: row.id,
    fromMe: row.sender_id === myAuthId,
    body: row.body,
    atLabel: t,
  }
}

export function useDirectMessages(
  activeUiThreadId: string | null,
  syncP2pThreadKeys: string[] = [],
  /** UUID session Supabase (`auth.uid()`), pas l’id Clerk. */
  cloudActorId?: string | null,
) {
  const { user: authUser } = useAuth()
  const myAuthId = cloudActorId ?? authUser?.id
  const [userByThread, setUserByThread] = useLocalStorageState<Record<string, DirectMessageLine[]>>(
    KEY_MESSAGES,
    {},
    isUserDmStore,
  )
  const [legacyVisitedIds, setLegacyVisitedIds] = useLocalStorageState<string[]>(
    KEY_VISITED,
    [],
    isStringArray,
  )
  const [lastReadByThread, setLastReadByThread] = useLocalStorageState<Record<string, string>>(
    KEY_LAST_READ,
    {},
    isLastReadStore,
  )
  const [cloudByKey, setCloudByKey] = useState<Record<string, DirectMessageLine[]>>({})

  const cloudKeyForActive = useMemo(
    () =>
      activeUiThreadId && myAuthId ? cloudPrivateThreadKey(activeUiThreadId, myAuthId) : null,
    [activeUiThreadId, myAuthId],
  )

  const p2pBundleSig = useMemo(() => [...syncP2pThreadKeys].sort().join('|'), [syncP2pThreadKeys])

  /** Fil Coach uniquement (clé `coach:<uuid>`) — les fils p2p amis passent par le bundle ci-dessous. */
  useEffect(() => {
    if (!cloudKeyForActive || !cloudKeyForActive.startsWith('coach:') || !isSupabaseConfigured()) return

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

  /** Tous les fils MP entre amis (p2p) — chargement + temps réel pour chaque clé. */
  useEffect(() => {
    if (!myAuthId || !p2pBundleSig || !isSupabaseConfigured()) return

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    const keys = syncP2pThreadKeys
    if (keys.length === 0) return

    let cancelled = false
    let ch: ReturnType<typeof sb.channel> | null = null

    const run = async () => {
      const session = await ensureSupabaseChatSession(sb)
      if (!session || cancelled) return
      await syncRealtimeAuth(sb)
      const myId = session.user.id

      await Promise.all(
        keys.map(async (threadKey) => {
          const { data: rows, error: fetchErr } = await sb
            .from('private_messages')
            .select('id, sender_id, body, created_at')
            .eq('thread_key', threadKey)
            .order('created_at', { ascending: true })
            .limit(200)
          if (cancelled || fetchErr || !rows?.length) return
          setCloudByKey((prev) => ({
            ...prev,
            [threadKey]: (rows as { id: string; sender_id: string; body: string; created_at: string }[]).map((r) =>
              rowToDmLine(r, myId),
            ),
          }))
        }),
      )

      if (cancelled) return

      let bundleCh = sb.channel(`private_dm_p2p_bundle:${myId}`)
      for (const threadKey of keys) {
        bundleCh = bundleCh.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `thread_key=eq.${threadKey}`,
          },
          (payload) => {
            const row = payload.new as {
              thread_key?: string
              id?: string
              sender_id?: string
              body?: string
              created_at?: string
            }
            const tk = row.thread_key
            if (!tk || !row.id || !row.sender_id || row.body == null || !row.created_at) return
            const line = rowToDmLine(
              { id: row.id, sender_id: row.sender_id, body: row.body, created_at: row.created_at },
              myId,
            )
            setCloudByKey((prev) => {
              const cur = prev[tk] ?? []
              if (cur.some((x) => x.id === line.id)) return prev
              return { ...prev, [tk]: [...cur, line] }
            })
          },
        )
      }
      ch = bundleCh
      bundleCh.subscribe()
    }

    void run()

    return () => {
      cancelled = true
      if (ch) void sb.removeChannel(ch)
    }
  }, [myAuthId, p2pBundleSig, syncP2pThreadKeys])

  const mergedFor = useCallback(
    (threadId: string) => {
      const seed = mockDirectMessagesByThread[threadId] ?? []
      const local = userByThread[threadId] ?? []
      const ck = cloudPrivateThreadKey(threadId, myAuthId)
      if (ck) {
        const cloud = cloudByKey[ck] ?? []
        if (threadId === TALKFOOT_BOT_DM_THREAD_ID) {
          const botLocal = local.filter((m) => !m.fromMe)
          return [...seed, ...cloud, ...botLocal]
        }
        return [...seed, ...cloud, ...local]
      }
      return [...seed, ...local]
    },
    [userByThread, cloudByKey, myAuthId],
  )

  const send = useCallback(
    (threadId: string, body: string): boolean => {
      const trimmed = body.trim()
      if (!trimmed) return false
      if (!moderateChatText(trimmed).ok) return false

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
            if (isSupabaseModerationError(error?.message)) return
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
        return true
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
      return true
    },
    [setUserByThread, myAuthId],
  )

  const markVisited = useCallback(
    (threadId: string) => {
      const lines = mergedFor(threadId)
      const last = lines[lines.length - 1]
      const lastId = last?.id ?? EMPTY_THREAD_READ
      setLastReadByThread((prev) =>
        prev[threadId] === lastId ? prev : { ...prev, [threadId]: lastId },
      )
    },
    [mergedFor, setLastReadByThread],
  )

  /** Migration : ancien « fil visité » → dernier message lu connu à ce moment-là. */
  useEffect(() => {
    if (legacyVisitedIds.length === 0) return
    setLastReadByThread((prev) => {
      let changed = false
      const next = { ...prev }
      for (const threadId of legacyVisitedIds) {
        if (next[threadId]) continue
        const lines = mergedFor(threadId)
        const last = lines[lines.length - 1]
        next[threadId] = last?.id ?? EMPTY_THREAD_READ
        changed = true
      }
      return changed ? next : prev
    })
    setLegacyVisitedIds([])
  }, [legacyVisitedIds, mergedFor, setLastReadByThread, setLegacyVisitedIds])

  return useMemo(
    () => ({ mergedFor, send, lastReadByThread, markVisited, cloudByKey }),
    [mergedFor, send, lastReadByThread, markVisited, cloudByKey],
  )
}
