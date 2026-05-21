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

type PixelBoard = Record<string, string>

type PixelRow = {
  x: number
  y: number
  color: string
}

function rowsToPixels(rows: PixelRow[]): PixelBoard {
  const out: PixelBoard = {}
  for (const r of rows) {
    if (r.x >= 0 && r.x < TIFO_BOARD_W && r.y >= 0 && r.y < TIFO_BOARD_H) {
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

export function useMatchTifoPixelsCloud(matchId: string | null) {
  const [pixels, setPixels] = useState<PixelBoard>({})
  const [remaining, setRemaining] = useState(TIFO_MAX_PER_USER_DAY)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const viewerIdRef = useRef<string | null>(null)

  const refreshUsage = useCallback(async (sb: ReturnType<typeof getSupabaseBrowserClient>, uid: string) => {
    if (!matchId || !sb) return
    const { data } = await sb
      .from('match_tifo_pixel_usage')
      .select('placement_count')
      .eq('user_id', uid)
      .eq('match_id', matchId)
      .eq('usage_date', tifoTodayKeyUtc())
      .maybeSingle()
    const used = typeof data?.placement_count === 'number' ? data.placement_count : 0
    setRemaining(Math.max(0, TIFO_MAX_PER_USER_DAY - used))
  }, [matchId])

  const refreshBoard = useCallback(async (sb: ReturnType<typeof getSupabaseBrowserClient>) => {
    if (!matchId || !sb) return
    const { data, error } = await sb
      .from('match_tifo_pixels')
      .select('x, y, color')
      .eq('match_id', matchId)
      .limit(10000)
    if (!error && data?.length) {
      setPixels(rowsToPixels(data as PixelRow[]))
    } else if (!error) {
      setPixels({})
    }
  }, [matchId])

  useEffect(() => {
    if (!matchId || !isSupabaseConfigured()) {
      setPixels({})
      setRemaining(TIFO_MAX_PER_USER_DAY)
      setLoading(false)
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    const mountId = Date.now()
    const channelRef: { current: ReturnType<typeof sb.channel> | null } = { current: null }

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

      const matchFilter = postgresChangesEqFilter('match_id', matchId)
      const channel = sb
        .channel(`match_tifo:${matchId}:${mountId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'match_tifo_pixels',
            filter: matchFilter,
          },
          (payload: RealtimePostgresChangesPayload<PixelRow>) => {
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
            filter: matchFilter,
          },
          (payload: RealtimePostgresChangesPayload<PixelRow>) => {
            const row = rowFromPayload(payload.new)
            if (row) applyPixel(row)
          },
        )
        .subscribe()

      if (cancelled) {
        void sb.removeChannel(channel)
        setLoading(false)
        return
      }
      channelRef.current = channel
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
      if (channelRef.current) {
        void sb.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [matchId, refreshBoard, refreshUsage])

  const placePixel = useCallback(
    async (x: number, y: number, color: string) => {
      if (!matchId) return false
      setNotice(null)
      if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return false
      if (remaining <= 0) {
        setNotice(`Limite : ${TIFO_MAX_PER_USER_DAY} pixels / jour sur ce match.`)
        return false
      }

      const sb = getSupabaseBrowserClient()
      if (!sb || !isSupabaseConfigured()) return false

      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session) return false
      viewerIdRef.current = session.user.id

      const key = tifoPixelKey(x, y)
      const prevColor = pixels[key]
      setPixels((prev) => ({ ...prev, [key]: color }))
      setRemaining((r) => Math.max(0, r - 1))

      const { error } = await sb.rpc('place_match_tifo_pixel', {
        p_match_id: matchId,
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
        } else if (import.meta.env.DEV) {
          setNotice('Impossible de placer le pixel pour le moment.')
          console.warn('[Talk Foot] place_match_tifo_pixel:', msg)
        } else {
          setNotice('Impossible de placer le pixel pour le moment.')
        }
        return false
      }
      return true
    },
    [matchId, remaining, pixels, refreshUsage],
  )

  return {
    pixels,
    placePixel,
    remaining,
    palette: [...TIFO_DEFAULT_PALETTE],
    boardW: TIFO_BOARD_W,
    boardH: TIFO_BOARD_H,
    notice,
    clearNotice: () => setNotice(null),
    loading,
    isShared: true,
  }
}
