import type { FirstVisitGuideId } from '../data/firstVisitGuides'

const STORAGE_KEY = 'tf.firstVisitGuides.v1'

function readSeen(): Set<FirstVisitGuideId> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is FirstVisitGuideId => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function hasSeenFirstVisitGuide(id: FirstVisitGuideId): boolean {
  return readSeen().has(id)
}

export function markFirstVisitGuideSeen(id: FirstVisitGuideId): void {
  const next = readSeen()
  next.add(id)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  } catch {
    /* quota / private mode */
  }
}
