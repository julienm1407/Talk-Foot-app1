import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  TIFO_BOARD_H,
  TIFO_BOARD_W,
  TIFO_DEFAULT_PALETTE,
  TIFO_MAX_PER_USER_DAY,
  tifoBoardScopeKey,
  tifoPixelKey,
  tifoTodayKeyUtc,
} from '../constants/tifoPixelBoard'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { useMatchTifoPixelsCloud } from './useMatchTifoPixelsCloud'

const STORE_KEY = 'talkfoot.tifo.store.v3'
const LEGACY_STORE_KEY = 'talkfoot.tifo.store.v2'

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
    const raw = localStorage.getItem(STORE_KEY) ?? localStorage.getItem(LEGACY_STORE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isRecord(parsed) && isRecord(parsed.boards) && isRecord(parsed.quota)) {
        return { boards: parsed.boards as AllBoards, quota: parsed.quota as QuotaStore }
      }
    }
  } catch {
    /* ignore */
  }
  return { boards: {}, quota: {} }
}

type Action = {
  type: 'place'
  scopeKey: string
  x: number
  y: number
  color: string
  day: string
}

function tifoReducer(state: TifoStore, action: Action): TifoStore {
  if (action.type !== 'place') return state
  const { scopeKey, x, y, color, day } = action
  if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return state
  const curQ = state.quota[day]?.[scopeKey] ?? 0
  if (curQ >= TIFO_MAX_PER_USER_DAY) return state
  const k = tifoPixelKey(x, y)
  const curBoard = state.boards[scopeKey] ?? { pixels: {} }
  return {
    boards: {
      ...state.boards,
      [scopeKey]: { ...curBoard, pixels: { ...curBoard.pixels, [k]: color } },
    },
    quota: {
      ...state.quota,
      [day]: { ...(state.quota[day] ?? {}), [scopeKey]: curQ + 1 },
    },
  }
}

function useMatchTifoPixelsLocal(groupId: string, matchId: string | null) {
  const [store, dispatch] = useReducer(tifoReducer, undefined, loadInitialStore)
  const [notice, setNotice] = useState<string | null>(null)
  const storeRef = useRef(store)
  storeRef.current = store

  const scopeKey = groupId && matchId ? tifoBoardScopeKey(groupId, matchId) : null

  useEffect(() => {
    setNotice(null)
  }, [scopeKey])

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store))
    } catch {
      /* quota / private mode */
    }
  }, [store])

  const board = scopeKey ? store.boards[scopeKey] : undefined
  const pixels = board?.pixels ?? {}

  const usedToday =
    scopeKey !== null ? (store.quota[tifoTodayKeyUtc()]?.[scopeKey] ?? 0) : 0
  const remaining = Math.max(0, TIFO_MAX_PER_USER_DAY - usedToday)

  const placePixel = useCallback(
    (x: number, y: number, color: string) => {
      if (!scopeKey) return false
      setNotice(null)
      if (x < 0 || x >= TIFO_BOARD_W || y < 0 || y >= TIFO_BOARD_H) return false
      const day = tifoTodayKeyUtc()
      const s = storeRef.current
      const curQ = s.quota[day]?.[scopeKey] ?? 0
      if (curQ >= TIFO_MAX_PER_USER_DAY) {
        setNotice(`Limite : ${TIFO_MAX_PER_USER_DAY} pixels / jour sur ce match.`)
        return false
      }
      dispatch({ type: 'place', scopeKey, x, y, color, day })
      return true
    },
    [scopeKey],
  )

  const deletePixelAsAdmin = useCallback(() => false, [])

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
    loading: false,
    isShared: false,
    isGroupAdmin: false,
  }
}

export function useMatchTifoPixels(options: {
  groupId: string
  matchId: string | null
  isGroupAdmin: boolean
}) {
  const { groupId, matchId, isGroupAdmin } = options
  const cloud = useMatchTifoPixelsCloud({ groupId, matchId, isGroupAdmin })
  const local = useMatchTifoPixelsLocal(groupId, matchId)
  if (isSupabaseConfigured()) return cloud
  return local
}
