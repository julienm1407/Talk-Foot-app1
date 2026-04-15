import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { Message } from '../types/chat'
import type { TribuneId } from '../types/tribune'
import { groupThreadMatchId } from '../utils/groupThreadMessages'
import { displayNameFromSession } from './useLiveMatchChatSync'

type GroupMsgRow = {
  id: string
  group_id: string
  channel_id: string
  user_id: string
  display_name: string
  body: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function pickTribune(v: unknown): TribuneId | undefined {
  if (v === 'virage' || v === 'analyse' || v === 'chill') return v
  return undefined
}

function rowToMessage(row: GroupMsgRow): Message {
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
    matchId: groupThreadMatchId(row.group_id, row.channel_id),
    userId: row.user_id,
    text: row.body,
    createdAt: new Date(row.created_at).getTime(),
    authorDisplayName: row.display_name,
    tribune: pickTribune(meta.tribune),
    supporterGroupId: typeof meta.supporterGroupId === 'string' ? meta.supporterGroupId : undefined,
    gifUrl: typeof meta.gifUrl === 'string' ? meta.gifUrl : undefined,
    emoteId: typeof meta.emoteId === 'string' ? meta.emoteId : undefined,
    groupScarf: scarfOk ? (groupScarf as NonNullable<Message['groupScarf']>) : undefined,
  }
}

export function useSupporterGroupChannelSync(options: {
  groupId: string
  channelId: string
  enabled: boolean
  onRemoteMessages: (msgs: Message[]) => void
}) {
  const { groupId, channelId, enabled, onRemoteMessages } = options
  const onRemoteMessagesRef = useRef(onRemoteMessages)
  useLayoutEffect(() => {
    onRemoteMessagesRef.current = onRemoteMessages
  }, [onRemoteMessages])

  const publishMessage = useCallback(
    async (msg: Pick<Message, 'matchId' | 'text'> & Partial<Message> & { groupId: string; channelId: string }) => {
      if (!isSupabaseConfigured()) return { ok: false as const, error: 'no_supabase' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false as const, error: 'no_client' }

      const session = await ensureSupabaseChatSession(sb)
      if (!session) return { ok: false as const, error: 'no_session' }

      const body = msg.text ?? ''
      const metadata: Record<string, unknown> = {}
      if (msg.tribune) metadata.tribune = msg.tribune
      if (msg.supporterGroupId) metadata.supporterGroupId = msg.supporterGroupId
      if (msg.gifUrl) metadata.gifUrl = msg.gifUrl
      if (msg.emoteId) metadata.emoteId = msg.emoteId
      if (msg.groupScarf) metadata.groupScarf = msg.groupScarf

      const displayName = displayNameFromSession(session.user)

      const { data, error } = await sb
        .from('supporter_group_channel_messages')
        .insert({
          group_id: msg.groupId,
          channel_id: msg.channelId,
          user_id: session.user.id,
          display_name: displayName,
          body,
          metadata,
        })
        .select('id, group_id, channel_id, user_id, display_name, body, metadata, created_at')
        .single()

      if (error || !data) {
        return { ok: false as const, error: error?.message ?? 'insert_failed' }
      }

      return { ok: true as const, message: rowToMessage(data as GroupMsgRow) }
    },
    [],
  )

  useEffect(() => {
    if (!enabled || !groupId || !channelId || !isSupabaseConfigured()) return

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    let ch: ReturnType<typeof sb.channel> | null = null

    const run = async () => {
      const session = await ensureSupabaseChatSession(sb)
      if (!session || cancelled) return

      const { data: rows, error: fetchErr } = await sb
        .from('supporter_group_channel_messages')
        .select('id, group_id, channel_id, user_id, display_name, body, metadata, created_at')
        .eq('group_id', groupId)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(200)

      if (!cancelled && !fetchErr && rows?.length) {
        onRemoteMessagesRef.current((rows as GroupMsgRow[]).map(rowToMessage))
      }

      if (cancelled) return

      ch = sb
        .channel(`group_ch:${groupId}:${channelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'supporter_group_channel_messages',
            filter: `group_id=eq.${groupId}`,
          },
          (payload: RealtimePostgresChangesPayload<GroupMsgRow>) => {
            const row = payload.new
            if (!row || typeof row !== 'object') return
            const r = row as GroupMsgRow
            if (r.channel_id !== channelId) return
            onRemoteMessagesRef.current([rowToMessage(r)])
          },
        )
        .subscribe()
    }

    void run()

    return () => {
      cancelled = true
      if (ch) void sb.removeChannel(ch)
    }
  }, [groupId, channelId, enabled])

  return { publishMessage, isCloudChatConfigured: isSupabaseConfigured() }
}
