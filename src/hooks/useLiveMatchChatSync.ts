import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { postgresChangesEqFilter } from '../lib/supabase/realtimeEqFilter'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import type { Message, MatchTribuneZone } from '../types/chat'
import type { TribuneId } from '../types/tribune'
import { validateOutgoingChatPayload } from '../utils/bannedWords'

type LiveMsgRow = {
  id: string
  match_id: string
  user_id: string
  display_name: string
  body: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function pickMatchTribune(v: unknown): MatchTribuneZone | undefined {
  if (v === 'home-ultras' || v === 'away-ultras' || v === 'analystes' || v === 'neutres') return v
  return undefined
}

function pickTribune(v: unknown): TribuneId | undefined {
  if (v === 'virage' || v === 'analyse' || v === 'chill') return v
  return undefined
}

function rowToMessage(row: LiveMsgRow): Message {
  const meta = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}
  const groupScarf = meta.groupScarf
  const scarfOk =
    groupScarf &&
    typeof groupScarf === 'object' &&
    !Array.isArray(groupScarf) &&
    typeof (groupScarf as { groupId?: unknown }).groupId === 'string' &&
    typeof (groupScarf as { groupName?: unknown }).groupName === 'string' &&
    typeof (groupScarf as { text?: unknown }).text === 'string' &&
    typeof (groupScarf as { colorA?: unknown }).colorA === 'string' &&
    typeof (groupScarf as { colorB?: unknown }).colorB === 'string' &&
    typeof (groupScarf as { colorC?: unknown }).colorC === 'string'

  return {
    id: row.id,
    matchId: row.match_id,
    userId: row.user_id,
    text: row.body,
    createdAt: new Date(row.created_at).getTime(),
    authorDisplayName: row.display_name,
    tribune: pickTribune(meta.tribune),
    matchTribune: pickMatchTribune(meta.matchTribune),
    supporterGroupId: typeof meta.supporterGroupId === 'string' ? meta.supporterGroupId : undefined,
    gifUrl: typeof meta.gifUrl === 'string' ? meta.gifUrl : undefined,
    emoteId: typeof meta.emoteId === 'string' ? meta.emoteId : undefined,
    groupScarf: scarfOk ? (groupScarf as NonNullable<Message['groupScarf']>) : undefined,
  }
}

export function displayNameFromSession(user: {
  user_metadata?: Record<string, unknown>
  email?: string | null
}): string {
  const meta = user.user_metadata
  const fromMeta =
    meta && typeof meta.display_name === 'string' ? meta.display_name.trim() : ''
  if (fromMeta) return fromMeta
  const email = user.email
  if (email && typeof email === 'string') {
    const part = email.split('@')[0]
    if (part) return part
  }
  return 'Supporteur'
}

export function useLiveMatchChatSync(options: {
  matchId: string
  enabled: boolean
  onRemoteMessages: (msgs: Message[]) => void
}) {
  const { matchId, enabled, onRemoteMessages } = options
  const onRemoteMessagesRef = useRef(onRemoteMessages)
  useLayoutEffect(() => {
    onRemoteMessagesRef.current = onRemoteMessages
  }, [onRemoteMessages])

  const publishMessage = useCallback(
    async (msg: Pick<Message, 'matchId' | 'text'> & Partial<Message>) => {
      if (!isSupabaseConfigured()) return { ok: false as const, error: 'no_supabase' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false as const, error: 'no_client' }

      const session = await ensureSupabaseChatSession(sb)
      if (!session) return { ok: false as const, error: 'no_session' }

      const body = msg.text ?? ''
      if (!validateOutgoingChatPayload({ text: body, groupScarf: msg.groupScarf }).ok) {
        return { ok: false as const, error: 'moderation' as const }
      }
      const metadata: Record<string, unknown> = {}
      if (msg.tribune) metadata.tribune = msg.tribune
      if (msg.matchTribune) metadata.matchTribune = msg.matchTribune
      if (msg.supporterGroupId) metadata.supporterGroupId = msg.supporterGroupId
      if (msg.gifUrl) metadata.gifUrl = msg.gifUrl
      if (msg.emoteId) metadata.emoteId = msg.emoteId
      if (msg.groupScarf) metadata.groupScarf = msg.groupScarf

      const displayName = displayNameFromSession(session.user)

      const { data, error } = await sb
        .from('live_match_messages')
        .insert({
          match_id: msg.matchId,
          user_id: session.user.id,
          display_name: displayName,
          body,
          metadata,
        })
        .select('id, match_id, user_id, display_name, body, metadata, created_at')
        .single()

      if (error || !data) {
        return { ok: false as const, error: error?.message ?? 'insert_failed' }
      }

      return { ok: true as const, message: rowToMessage(data as LiveMsgRow) }
    },
    [],
  )

  useEffect(() => {
    if (!enabled || !matchId || !isSupabaseConfigured()) return

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    const channelRef: { current: ReturnType<typeof sb.channel> | null } = { current: null }

    const run = async () => {
      const session = await ensureSupabaseChatSession(sb)
      if (!session || cancelled) return
      await syncRealtimeAuth(sb)

      const { data: rows, error: fetchErr } = await sb
        .from('live_match_messages')
        .select('id, match_id, user_id, display_name, body, metadata, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(200)

      if (cancelled) return

      if (!fetchErr && rows?.length) {
        onRemoteMessagesRef.current((rows as LiveMsgRow[]).map(rowToMessage))
      }

      if (cancelled) return

      const matchFilter = postgresChangesEqFilter('match_id', matchId)
      const channel = sb
        .channel(`live_match_chat:${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'live_match_messages',
            filter: matchFilter,
          },
          (payload: RealtimePostgresChangesPayload<LiveMsgRow>) => {
            const row = payload.new
            if (!row || typeof row !== 'object') return
            onRemoteMessagesRef.current([rowToMessage(row as LiveMsgRow)])
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] live_match_messages realtime:', status)
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
  }, [matchId, enabled])

  return { publishMessage, isCloudChatConfigured: isSupabaseConfigured() }
}
