import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { postgresChangesEqFilter } from '../lib/supabase/realtimeEqFilter'
import type { ReactionEvent, ReactionType } from '../types/chat'

type ReactionRow = {
  id: string
  match_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

export function rowToReactionEvent(row: ReactionRow, matchId: string): ReactionEvent | null {
  const t = row.reaction_type
  if (t !== 'flare' && t !== 'confetti' && t !== 'goal' && t !== 'rage') return null
  return {
    id: row.id,
    matchId,
    userId: row.user_id,
    type: t as ReactionType,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function useLiveMatchReactionsSync(options: {
  matchId: string
  enabled: boolean
  onHydrate: (events: ReactionEvent[]) => void
  onLiveInsert: (event: ReactionEvent) => void
}) {
  const { matchId, enabled, onHydrate, onLiveInsert } = options
  const onHydrateRef = useRef(onHydrate)
  const onLiveInsertRef = useRef(onLiveInsert)
  useLayoutEffect(() => {
    onHydrateRef.current = onHydrate
    onLiveInsertRef.current = onLiveInsert
  }, [onHydrate, onLiveInsert])

  const publishReaction = useCallback(
    async (reactionType: ReactionType) => {
      if (!isSupabaseConfigured()) return { ok: false as const, error: 'no_supabase' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false as const, error: 'no_client' }
      const session = await ensureSupabaseChatSession(sb)
      if (!session) return { ok: false as const, error: 'no_session' }

      const { data, error } = await sb
        .from('live_match_reactions')
        .insert({
          match_id: matchId,
          user_id: session.user.id,
          reaction_type: reactionType,
        })
        .select('id, match_id, user_id, reaction_type, created_at')
        .single()

      if (error || !data) return { ok: false as const, error: error?.message ?? 'insert_failed' }
      const ev = rowToReactionEvent(data as ReactionRow, matchId)
      if (!ev) return { ok: false as const, error: 'invalid_type' }
      return { ok: true as const, event: ev }
    },
    [matchId],
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

      const { data: rows, error: fetchErr } = await sb
        .from('live_match_reactions')
        .select('id, match_id, user_id, reaction_type, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(120)

      if (cancelled) return

      if (!fetchErr && rows?.length) {
        const events = (rows as ReactionRow[])
          .map((r) => rowToReactionEvent(r, matchId))
          .filter((e): e is ReactionEvent => e != null)
        if (events.length) onHydrateRef.current(events)
      }

      if (cancelled) return

      const matchFilter = postgresChangesEqFilter('match_id', matchId)
      const channel = sb
        .channel(`live_match_rx:${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'live_match_reactions',
            filter: matchFilter,
          },
          (payload: RealtimePostgresChangesPayload<ReactionRow>) => {
            const row = payload.new
            if (!row || typeof row !== 'object') return
            const ev = rowToReactionEvent(row as ReactionRow, matchId)
            if (ev) onLiveInsertRef.current(ev)
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] live_match_reactions realtime:', status)
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

  return { publishReaction, isCloudReactionsConfigured: isSupabaseConfigured() }
}
