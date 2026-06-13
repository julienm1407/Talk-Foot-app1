import type { SmFixture } from './types'

/** SportMonks v3 renvoie souvent `{ data: [...] }` pour les includes — on normalise en tableaux plats. */
export function smIncludeRows<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const data = (raw as { data?: unknown }).data
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

export function normalizeSmFixtureIncludes(fixture: SmFixture | null | undefined): SmFixture | null {
  if (!fixture || typeof fixture !== 'object') return null
  const f = fixture as SmFixture & {
    periods?: unknown
    events?: unknown
    comments?: unknown
    lineups?: unknown
    statistics?: unknown
    scores?: unknown
  }
  return {
    ...f,
    periods: smIncludeRows(f.periods),
    events: smIncludeRows(f.events),
    comments: smIncludeRows(f.comments),
    lineups: smIncludeRows(f.lineups),
    statistics: smIncludeRows(f.statistics),
    scores: smIncludeRows(f.scores),
  }
}
