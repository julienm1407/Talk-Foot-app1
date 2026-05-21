import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import {
  TIFO_BOARD_H,
  TIFO_BOARD_W,
  TIFO_DEFAULT_PALETTE,
  TIFO_MAX_PER_USER_DAY,
  tifoPixelKey,
  tifoTodayKeyUtc,
} from '../constants/tifoPixelBoard'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { postgresChangesEqFilter } from '../lib/supabase/realtimeEqFilter'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'

const TIFO_PIXEL_BROADCAST = 'match_tifo_pixel'
const TIFO_PIXEL_DELETE_BROADCAST = 'match_tifo_pixel_delete'
const TIFO_POLL_MS = 3500

type PixelBoard = Record<string, string>

type PixelRow = {
  x: number
  y: number
  color: string
}

type TifoScope = {
  groupId: string
  matchId: string
}

function rowsToPixels(rows: PixelRow[]): PixelBoard {
  const out: PixelBoard = {}
  for (const r of rows) {
    if (r.x >= 0 && r.x < TIFO_BOARD_W && r.y >= 0 && r.y < TIFO_BOARD_H && r.color) {
      out[tifoPixelKey(r.x, r.y)] = r.color
    }
  }
  return out
}

function rowFromPayload(row: unknown): PixelRow | null {
  if (!row || typeof row !== 'object') return null
  const o = row as Record<string, unknown>
  const x = typeof o.x === 'number' ? o.x : Number(o.x)
  const y = typeof o.y === 'number' ? o.y : Number(o.y)
  const color = typeof o.color === 'string' ? o.color : ''
  if (!Number.isFinite(x) || !Number.isFinite(y) || !color) return null
  return { x, y, color }
}

function payloadMatchesScope(payload: unknown, scope: TifoScope): boolean {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return p.group_id === scope.groupId && p.match_id === scope.matchId
}

function broadcastPayloadToRow(payload: unknown, scope: TifoScope): PixelRow | null {
  if (!payloadMatchesScope(payload, scope)) return null
  const p = payload as Record<string, unknown>
  return rowFromPayload({ x: p.x, y: p.y, color: p.color })
}

function broadcastDeleteToCell(payload: unknown, scope: TifoScope): { x: number; y: number } | null {
  if (!payloadMatchesScope(payload, scope)) return null
  const p = payload as Record<string, unknown>
  const x = typeof p.x === 'number' ? p.x : Number(p.x)
  const y = typeof p.y === 'number' ? p.y : Number(p.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

export function useMatchTifoPixelsCloud(options: {
  groupId: string
  matchId: string | null
  isGroupAdmin: boolean
}) {
  const { groupId, matchId, isGroupAdmin } = options
  const [pixels, setPixels] = useState<PixelBoard>({})
  const [remaining, setRemaining] = useState(TIFO_MAX_PER_USER_DAY)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const viewerIdRef = useRef<string | null>(null)
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseBrowserClient>>['channel']> | null>(
    null,
  )

  const scope: TifoScope | null = groupId && matchId ? { groupId, matchId } : null

  const clearPixel = useCallback((x: number, y: number) => {
    const key = tifoPixelKey(x, y)
    setPixels((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const refreshUsage = useCallback(
    async (sb: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>, uid: string) => {
      if (!scope) return
      const { data, error } = await sb
        .from('match_tifo_pixel_usage')
        .select('placement_count')
        .eq('user_id', uid)
        .eq('group_id', scope.groupId)
        .eq('match_id', scope.matchId)
        .eq('usage_date', tifoTodayKeyUtc())
        .maybeSingle()
      if (error && import.meta.env.DEV) {
        console.warn('[Talk Foot] match_tifo_pixel_usage:', error.message)
      }
      const used = typeof data?.placement_count === 'number' ? data.placement_count : 0
      setRemaining(Math.max(0, TIFO_MAX_PER_USER_DAY - used))
    },
    [scope],
  )

  const refreshBoard = useCallback(
    async (sb: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) => {
      if (!scope) return
      const { data, error } = await sb
        .from('match_tifo_pixels')
        .select('x, y, color')
        .eq('group_id', scope.groupId)
        .eq('match_id', scope.matchId)
        .limit(10000)
      if (error) {
        if (import.meta.env.DEV) console.warn('[Talk Foot] match_tifo_pixels fetch:', error.message)
        return
      }
      setPixels(rowsToPixels((data ?? []) as PixelRow[]))
    },
    [scope],
  )

  useEffect(() => {
    setPixels({})
    setRemaining(TIFO_MAX_PER_USER_DAY)
    setNotice(null)

    if (!scope || !isSupabaseConfigured()) {
      setLoading(false)
      channelRef.current = null
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false

    const applyPixel = (row: PixelRow) => {
      setPixels((prev) => ({ ...prev, [tifoPixelKey(row.x, row.y)]: row.color }))
    }

    const run = async () => {
      setLoading(true)
      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session || cancelled) {
        setLoading(false)
        return
      }
      viewerIdRef.current = session.user.id
      await syncRealtimeAuth(sb)
      await Promise.all([refreshBoard(sb), refreshUsage(sb, session.user.id)])
      if (cancelled) {
        setLoading(false)
        return
      }

      const groupFilter = postgresChangesEqFilter('group_id', scope.groupId)
      const channel = sb
        .channel(`match_tifo:${scope.groupId}:${scope.matchId}`, {
          config: { broadcast: { self: true } },
        })
        .on('broadcast', { event: TIFO_PIXEL_BROADCAST }, (msg) => {
          const row = broadcastPayloadToRow(msg.payload, scope)
          if (row) applyPixel(row)
        })
        .on('broadcast', { event: TIFO_PIXEL_DELETE_BROADCAST }, (msg) => {
          const cell = broadcastDeleteToCell(msg.payload, scope)
          if (cell) clearPixel(cell.x, cell.y)
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'match_tifo_pixels',
            filter: groupFilter,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            if (payload.new && (payload.new as Record<string, unknown>).match_id !== scope.matchId) return
            const row = rowFromPayload(payload.new)
            if (row) applyPixel(row)
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'match_tifo_pixels',
            filter: groupFilter,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            if (payload.new && (payload.new as Record<string, unknown>).match_id !== scope.matchId) return
            const row = rowFromPayload(payload.new)
            if (row) applyPixel(row)
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'match_tifo_pixels',
            filter: groupFilter,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            const old = payload.old as Record<string, unknown> | undefined
            if (!old || old.match_id !== scope.matchId) return
            const x = typeof old.x === 'number' ? old.x : Number(old.x)
            const y = typeof old.y === 'number' ? old.y : Number(old.y)
            if (Number.isFinite(x) && Number.isFinite(y)) clearPixel(x, y)
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
            console.warn('[Talk Foot] match_tifo realtime:', status)
          }
        })

      if (cancelled) {
        void sb.removeChannel(channel)
        setLoading(false)
        return
      }
      channelRef.current = channel
      setLoading(false)
    }

    void run()

    const pollId = window.setInterval(() => {
      if (!cancelled) void refreshBoard(sb)
    }, TIFO_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      if (channelRef.current) {
        void sb.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [scope, refreshBoard, refreshUsage, clearPixel])

  const placePixel = useCallback(
    async (x: number, y: number, color: string) => {
      if (!scope) return false
      setNotice(null)
      if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return false
      if (remaining <= 0) {
        setNotice(`Limite : ${TIFO_MAX_PER_USER_DAY} pixels / jour sur ce match.`)
        return false
      }

      const sb = getSupabaseBrowserClient()
      if (!sb || !isSupabaseConfigured()) return false

      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session) {
        setNotice('Session indisponible — réessaie dans un instant.')
        return false
      }
      viewerIdRef.current = session.user.id
      await syncRealtimeAuth(sb)

      const key = tifoPixelKey(x, y)
      const prevColor = pixels[key]
      setPixels((prev) => ({ ...prev, [key]: color }))
      setRemaining((r) => Math.max(0, r - 1))

      const { error } = await sb.rpc('place_match_tifo_pixel', {
        p_group_id: scope.groupId,
        p_match_id: scope.matchId,
        p_x: x,
        p_y: y,
        p_color: color,
      })

      if (error) {
        setPixels((prev) => {
          const next = { ...prev }
          if (prevColor) next[key] = prevColor
          else delete next[key]
          return next
        })
        await refreshUsage(sb, session.user.id)
        const msg = error.message ?? ''
        if (msg.includes('daily_limit') || error.code === 'P0001') {
          setNotice(`Limite : ${TIFO_MAX_PER_USER_DAY} pixels / jour sur ce match.`)
        } else {
          setNotice('Impossible de placer le pixel pour le moment.')
          if (import.meta.env.DEV) console.warn('[Talk Foot] place_match_tifo_pixel:', msg)
        }
        return false
      }

      const ch = channelRef.current
      if (ch) {
        void ch.send({
          type: 'broadcast',
          event: TIFO_PIXEL_BROADCAST,
          payload: {
            group_id: scope.groupId,
            match_id: scope.matchId,
            x,
            y,
            color,
          },
        })
      }

      void refreshBoard(sb)
      void refreshUsage(sb, session.user.id)
      return true
    },
    [scope, remaining, pixels, refreshBoard, refreshUsage],
  )

  const deletePixelAsAdmin = useCallback(
    async (x: number, y: number) => {
      if (!scope || !isGroupAdmin) return false
      setNotice(null)
      const key = tifoPixelKey(x, y)
      if (!pixels[key]) return false

      const sb = getSupabaseBrowserClient()
      if (!sb || !isSupabaseConfigured()) return false

      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session) {
        setNotice('Session indisponible — réessaie dans un instant.')
        return false
      }
      await syncRealtimeAuth(sb)

      const { error } = await sb.rpc('delete_match_tifo_pixel_admin', {
        p_group_id: scope.groupId,
        p_match_id: scope.matchId,
        p_x: x,
        p_y: y,
      })

      if (error) {
        const msg = error.message ?? ''
        if (msg.includes('not_group_owner')) {
          setNotice('Seul le propriétaire du groupe peut supprimer des pixels.')
        } else {
          setNotice('Suppression impossible pour le moment.')
          if (import.meta.env.DEV) console.warn('[Talk Foot] delete_match_tifo_pixel_admin:', msg)
        }
        return false
      }

      clearPixel(x, y)

      const ch = channelRef.current
      if (ch) {
        void ch.send({
          type: 'broadcast',
          event: TIFO_PIXEL_DELETE_BROADCAST,
          payload: {
            group_id: scope.groupId,
            match_id: scope.matchId,
            x,
            y,
          },
        })
      }

      void refreshBoard(sb)
      return true
    },
    [scope, isGroupAdmin, pixels, clearPixel, refreshBoard],
  )

  return {
    pixels,
    placePixel,
    deletePixelAsAdmin,
    remaining,
    palette: [...TIFO_DEFAULT_PALETTE],
    boardW: TIFO_BOARD_W,
    boardH: TIFO_BOARD_H,
    notice,
    clearNotice: () => setNotice(null),
    loading,
    isShared: true,
    isGroupAdmin,
  }
}
