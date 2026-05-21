import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  TIFO_BOARD_H,
  TIFO_BOARD_W,
  TIFO_DEFAULT_PALETTE,
  TIFO_MAX_PER_USER_DAY,
  tifoPixelKey,
  tifoTodayKeyUtc,
} from '../constants/tifoPixelBoard'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { useMatchTifoPixelsCloud } from './useMatchTifoPixelsCloud'

const STORE_KEY = 'talkfoot.tifo.store.v2'
const LEGACY_PIXELS = 'talkfoot.tifo.pixels.v1'
const LEGACY_QUOTA = 'talkfoot.tifo.quota.v1'

type PixelBoard = Record<string, string>
type AllBoards = Record<string, { pixels: PixelBoard; until?: number }>
type QuotaStore = Record<string, Record<string, number>>

type TifoStore = {
  boards: AllBoards
  quota: QuotaStore
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function loadInitialStore(): TifoStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isRecord(parsed) && isRecord(parsed.boards) && isRecord(parsed.quota)) {
        return { boards: parsed.boards as AllBoards, quota: parsed.quota as QuotaStore }
      }
    }
    const bRaw = localStorage.getItem(LEGACY_PIXELS)
    const qRaw = localStorage.getItem(LEGACY_QUOTA)
    let boards: AllBoards = {}
    let quota: QuotaStore = {}
    if (bRaw) {
      const p: unknown = JSON.parse(bRaw)
      if (isRecord(p)) boards = p as AllBoards
    }
    if (qRaw) {
      const p: unknown = JSON.parse(qRaw)
      if (isRecord(p)) quota = p as QuotaStore
    }
    const merged = { boards, quota }
    if (Object.keys(boards).length > 0 || Object.keys(quota).length > 0) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(merged))
      } catch {
        /* ignore */
      }
    }
    return merged
  } catch {
    return { boards: {}, quota: {} }
  }
}

type Action = {
  type: 'place'
  matchId: string
  x: number
  y: number
  color: string
  day: string
}

function tifoReducer(state: TifoStore, action: Action): TifoStore {
  if (action.type !== 'place') return state
  const { matchId, x, y, color, day } = action
  if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return state
  const curQ = state.quota[day]?.[matchId] ?? 0
  if (curQ >= TIFO_MAX_PER_USER_DAY) return state
  const k = tifoPixelKey(x, y)
  const curBoard = state.boards[matchId] ?? { pixels: {} }
  return {
    boards: {
      ...state.boards,
      [matchId]: { ...curBoard, pixels: { ...curBoard.pixels, [k]: color } },
    },
    quota: {
      ...state.quota,
      [day]: { ...(state.quota[day] ?? {}), [matchId]: curQ + 1 },
    },
  }
}

function useMatchTifoPixelsLocal(matchId: string | null) {
  const [store, dispatch] = useReducer(tifoReducer, undefined, loadInitialStore)
  const [notice, setNotice] = useState<string | null>(null)
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store))
    } catch {
      /* quota / private mode */
    }
  }, [store])

  const board = matchId ? store.boards[matchId] : undefined
  const pixels = board?.pixels ?? {}

  const usedToday =
    matchId !== null ? (store.quota[tifoTodayKeyUtc()]?.[matchId] ?? 0) : 0
  const remaining = Math.max(0, TIFO_MAX_PER_USER_DAY - usedToday)

  const placePixel = useCallback(
    (x: number, y: number, color: string) => {
      if (!matchId) return false
      setNotice(null)
      if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return false
      const day = tifoTodayKeyUtc()
      const s = storeRef.current
      const curQ = s.quota[day]?.[matchId] ?? 0
      if (curQ >= TIFO_MAX_PER_USER_DAY) {
        setNotice(`Limite : ${TIFO_MAX_PER_USER_DAY} pixels / jour sur ce match.`)
        return false
      }
      dispatch({ type: 'place', matchId, x, y, color, day })
      return true
    },
    [matchId],
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
    loading: false,
    isShared: false,
  }
}

/** Tifo pixel : grille partagée via Supabase si configuré, sinon localStorage. */
export function useMatchTifoPixels(matchId: string | null) {
  const cloud = useMatchTifoPixelsCloud(matchId)
  const local = useMatchTifoPixelsLocal(matchId)
  if (isSupabaseConfigured()) return cloud
  return local
}
