import {
  LIGUE1_CHOC_PAIRS,
  LIGUE1_TOP5_IDS,
  TALKFOOT_FORCE_BY_DAY,
} from '../data/talkFootEditorial'

const STORAGE_KEY = 'talkfoot.editorial.v1'

export type TalkFootEditorialResolved = {
  chocPairs: Array<[string, string]>
  top5Ids: string[]
  forceByDay: Record<string, string>
}

type Overlay = Partial<TalkFootEditorialResolved>

function readOverlay(): Overlay {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as Overlay
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

export function readTalkFootEditorial(): TalkFootEditorialResolved {
  const o = typeof window === 'undefined' ? {} : readOverlay()
  return {
    chocPairs: Array.isArray(o.chocPairs) && o.chocPairs.length
      ? o.chocPairs
      : LIGUE1_CHOC_PAIRS.map(([a, b]) => [a, b]),
    top5Ids: Array.isArray(o.top5Ids) && o.top5Ids.length ? o.top5Ids : [...LIGUE1_TOP5_IDS],
    forceByDay: { ...TALKFOOT_FORCE_BY_DAY, ...(o.forceByDay ?? {}) },
  }
}

export function writeTalkFootEditorialOverlay(patch: Overlay): TalkFootEditorialResolved {
  const current = readTalkFootEditorial()
  const next: TalkFootEditorialResolved = {
    chocPairs: patch.chocPairs ?? current.chocPairs,
    top5Ids: patch.top5Ids ?? current.top5Ids,
    forceByDay: patch.forceByDay ?? current.forceByDay,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  return next
}

export function resetTalkFootEditorialOverlay(): TalkFootEditorialResolved {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode */
  }
  return readTalkFootEditorial()
}
