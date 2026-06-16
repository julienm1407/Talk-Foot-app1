import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import {
  TIFO_BOARD_H,
  TIFO_BOARD_W,
  TIFO_DEFAULT_PALETTE,
  TIFO_MAX_PER_USER_DAY,
  tifoPixelKey,
} from '../constants/tifoPixelBoard'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { postgresChangesEqFilter } from '../lib/supabase/realtimeEqFilter'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import { syncMatchTifoEngagementBonuses } from '../lib/supabase/syncMatchTifoEngagement'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import { TIFO_ENGAGEMENT_SYNC_EVENT, type TifoEngagementSyncDetail } from '../utils/tifoEngagementEvents'

const TIFO_PIXEL_BROADCAST = 'match_tifo_pixel'
const TIFO_PIXEL_DELETE_BROADCAST = 'match_tifo_pixel_delete'
const TIFO_POLL_MS = 3500

type PixelBoard = Record<string, string>

type PixelRow = {
  x: number
  y: number
  color: string
  user_id?: string | null
}

type PixelOwners = Record<string, string>

type TifoScope = {
  groupId: string
  matchId: string
}

function rowsToPixels(rows: PixelRow[]): { pixels: PixelBoard; owners: PixelOwners } {
  const pixels: PixelBoard = {}
  const owners: PixelOwners = {}
  for (const r of rows) {
    if (r.x >= 0 && r.x < TIFO_BOARD_W && r.y >= 0 && r.y < TIFO_BOARD_H && r.color) {
      const key = tifoPixelKey(r.x, r.y)
      pixels[key] = r.color
      if (typeof r.user_id === 'string' && r.user_id) owners[key] = r.user_id
    }
  }
  return { pixels, owners }
}

function rowFromPayload(row: unknown): PixelRow | null {
  if (!row || typeof row !== 'object') return null
  const o = row as Record<string, unknown>
  const x = typeof o.x === 'number' ? o.x : Number(o.x)
  const y = typeof o.y === 'number' ? o.y : Number(o.y)
  const color = typeof o.color === 'string' ? o.color : ''
  const user_id = typeof o.user_id === 'string' ? o.user_id : null
  if (!Number.isFinite(x) || !Number.isFinite(y) || !color) return null
  return { x, y, color, user_id }
}

function payloadMatchesScope(payload: unknown, scope: TifoScope): boolean {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return p.group_id === scope.groupId && p.match_id === scope.matchId
}

function broadcastPayloadToRow(payload: unknown, scope: TifoScope): PixelRow | null {
  if (!payloadMatchesScope(payload, scope)) return null
  const p = payload as Record<string, unknown>
  const user_id = typeof p.user_id === 'string' ? p.user_id : null
  const row = rowFromPayload({ x: p.x, y: p.y, color: p.color, user_id })
  return row
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
  const [pixelOwners, setPixelOwners] = useState<PixelOwners>({})
  const [remaining, setRemaining] = useState(TIFO_MAX_PER_USER_DAY)
  const [dailyLimit, setDailyLimit] = useState(TIFO_MAX_PER_USER_DAY)
  const [bonusAllowance, setBonusAllowance] = useState(0)
  const [engagementNotice, setEngagementNotice] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const viewerIdRef = useRef<string | null>(null)
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseBrowserClient>>['channel']> | null>(
    null,
  )

  const scope = useMemo<TifoScope | null>(
    () => (groupId && matchId ? { groupId, matchId } : null),
    [groupId, matchId],
  )

  const clearPixel = useCallback((x: number, y: number) => {
    const key = tifoPixelKey(x, y)
    setPixels((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPixelOwners((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const refreshUsage = useCallback(
    async (_sb: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>, _uid: string) => {
      if (!groupId || !matchId) return
      const synced = await syncMatchTifoEngagementBonuses(groupId, matchId)
      if (!synced) return
      setDailyLimit(synced.daily_limit)
      setBonusAllowance(synced.bonus_allowance)
      setRemaining(synced.remaining)
      if (synced.new_bonus_pixels > 0) {
        setEngagementNotice(`+${synced.new_bonus_pixels} pixels bonus gagnés !`)
      }
    },
    [groupId, matchId],
  )

  const refreshBoard = useCallback(
    async (sb: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) => {
      if (!groupId || !matchId) return
      const { data, error } = await sb
        .from('match_tifo_pixels')
        .select('x, y, color, user_id')
        .eq('group_id', groupId)
        .eq('match_id', matchId)
        .limit(10000)
      if (error) {
        if (import.meta.env.DEV) console.warn('[Talk Foot] match_tifo_pixels fetch:', error.message)
        return
      }
      const { pixels: nextPixels, owners: nextOwners } = rowsToPixels((data ?? []) as PixelRow[])
      setPixels(nextPixels)
      setPixelOwners(nextOwners)
    },
    [groupId, matchId],
  )

  useEffect(() => {
    setPixels({})
    setPixelOwners({})
    setRemaining(TIFO_MAX_PER_USER_DAY)
    setDailyLimit(TIFO_MAX_PER_USER_DAY)
    setBonusAllowance(0)
    setEngagementNotice(null)
    setNotice(null)

    if (!scope || !isSupabaseConfigured()) {
      setLoading(false)
      channelRef.current = null
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setLoading(false)
      return
    }

    let cancelled = false
    const scopeSnapshot = scope

    const applyPixel = (row: PixelRow, ownerId?: string | null) => {
      const key = tifoPixelKey(row.x, row.y)
      setPixels((prev) => ({ ...prev, [key]: row.color }))
      if (ownerId) {
        setPixelOwners((prev) => ({ ...prev, [key]: ownerId }))
      }
    }

    const run = async () => {
      setLoading(true)
      try {
        const session = await ensureTalkFootSupabaseSession(sb)
        if (!session || cancelled || !scopeSnapshot) return
        viewerIdRef.current = session.user.id
        await syncRealtimeAuth(sb)
        await Promise.all([refreshBoard(sb), refreshUsage(sb, session.user.id)])
        if (cancelled || !scopeSnapshot) return

        const groupFilter = postgresChangesEqFilter('group_id', scopeSnapshot.groupId)
        const channel = sb
          .channel(`match_tifo:${scopeSnapshot.groupId}:${scopeSnapshot.matchId}`, {
            config: { broadcast: { self: true } },
          })
          .on('broadcast', { event: TIFO_PIXEL_BROADCAST }, (msg) => {
            const row = broadcastPayloadToRow(msg.payload, scopeSnapshot)
            if (row) applyPixel(row, row.user_id ?? undefined)
          })
          .on('broadcast', { event: TIFO_PIXEL_DELETE_BROADCAST }, (msg) => {
            const cell = broadcastDeleteToCell(msg.payload, scopeSnapshot)
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
              if (payload.new && (payload.new as Record<string, unknown>).match_id !== scopeSnapshot.matchId)
                return
              const row = rowFromPayload(payload.new)
              if (row) applyPixel(row, row.user_id ?? undefined)
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
              if (payload.new && (payload.new as Record<string, unknown>).match_id !== scopeSnapshot.matchId)
                return
              const row = rowFromPayload(payload.new)
              if (row) applyPixel(row, row.user_id ?? undefined)
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
              if (!old || old.match_id !== scopeSnapshot.matchId) return
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
          return
        }
        channelRef.current = channel
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    const safetyOff = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 6000)

    const pollId = window.setInterval(() => {
      if (!cancelled) {
        void refreshBoard(sb)
        if (viewerIdRef.current) void refreshUsage(sb, viewerIdRef.current)
      }
    }, TIFO_POLL_MS)

    const onEngagementSync = (event: Event) => {
      const detail = (event as CustomEvent<TifoEngagementSyncDetail>).detail
      if (!detail) return
      if (detail.matchId === '*') {
        if (!detail.groupId || detail.groupId !== scopeSnapshot.groupId) return
      } else if (detail.matchId !== scopeSnapshot.matchId) {
        return
      }
      if (detail.groupId && detail.groupId !== scopeSnapshot.groupId) return
      if (viewerIdRef.current) void refreshUsage(sb, viewerIdRef.current)
    }
    window.addEventListener(TIFO_ENGAGEMENT_SYNC_EVENT, onEngagementSync)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      window.clearTimeout(safetyOff)
      window.removeEventListener(TIFO_ENGAGEMENT_SYNC_EVENT, onEngagementSync)
      setLoading(false)
      if (channelRef.current) {
        void sb.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [groupId, matchId, scope, refreshBoard, refreshUsage, clearPixel])

  const placePixel = useCallback(
    async (x: number, y: number, color: string) => {
      if (!scope) return false
      setNotice(null)
      if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return false

      const key = tifoPixelKey(x, y)
      const previousColor = pixels[key]
      const previousOwner = pixelOwners[key]

      const sb = getSupabaseBrowserClient()
      if (!sb || !isSupabaseConfigured()) return false

      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session) {
        setNotice('Session indisponible — réessaie dans un instant.')
        return false
      }
      viewerIdRef.current = session.user.id
      await syncRealtimeAuth(sb)

      const uid = session.user.id
      const chargesQuota = !previousColor || previousOwner !== uid
      if (chargesQuota && remaining <= 0) {
        setNotice(`Limite : ${dailyLimit} pixels / jour sur ce match.`)
        return false
      }

      setPixels((prev) => ({ ...prev, [key]: color }))
      setPixelOwners((prev) => ({ ...prev, [key]: uid }))
      if (chargesQuota) setRemaining((r) => Math.max(0, r - 1))

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
          if (previousColor) next[key] = previousColor
          else delete next[key]
          return next
        })
        setPixelOwners((prev) => {
          const next = { ...prev }
          if (previousOwner) next[key] = previousOwner
          else delete next[key]
          return next
        })
        await refreshUsage(sb, uid)
        const msg = error.message ?? ''
        if (msg.includes('daily_limit') || error.code === 'P0001') {
          setNotice(`Limite : ${dailyLimit} pixels / jour sur ce match.`)
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
            user_id: uid,
          },
        })
      }

      void refreshBoard(sb)
      void refreshUsage(sb, uid)
      return true
    },
    [scope, remaining, dailyLimit, pixels, pixelOwners, refreshBoard, refreshUsage],
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
    dailyLimit,
    bonusAllowance,
    palette: [...TIFO_DEFAULT_PALETTE],
    boardW: TIFO_BOARD_W,
    boardH: TIFO_BOARD_H,
    notice,
    engagementNotice,
    clearNotice: () => setNotice(null),
    clearEngagementNotice: () => setEngagementNotice(null),
    loading,
    isShared: true,
    isGroupAdmin,
  }
}
