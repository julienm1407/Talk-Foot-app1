import type { SmFixture } from './types'
import { normalizeSmFixtureIncludes } from './normalizeSmFixtureIncludes'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type LineupCoach = {
  name: string
  photoUrl?: string
}

export type LineupCoachesBySide = { home: LineupCoach | null; away: LineupCoach | null }

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function coachName(obj: Record<string, unknown> | null): string {
  if (!obj) return ''
  const dn = String(obj.display_name ?? obj.common_name ?? '').trim()
  if (dn) return dn
  const n = String(obj.name ?? '').trim()
  if (n) return n
  const fn = String(obj.firstname ?? '').trim()
  const ln = String(obj.lastname ?? '').trim()
  return `${fn} ${ln}`.trim()
}

function typeScore(row: Record<string, unknown>): number {
  const t = `${JSON.stringify(row.type ?? '')} ${row.developer_name ?? ''}`.toUpperCase()
  if (t.includes('ASSISTANT')) return 1
  if (t.includes('HEAD') || t.includes('MANAGER') || t.includes('COACH')) return 3
  return 2
}

export function extractCoachesFromSmFixture(fixture: SmFixture | null | undefined): LineupCoachesBySide {
  const empty: LineupCoachesBySide = { home: null, away: null }
  if (!fixture) return empty
  const fx = normalizeSmFixtureIncludes(fixture) ?? fixture
  const sides = smFixtureHomeAwayParticipantIds(fx)
  if (sides.homeId == null || sides.awayId == null) return empty
  const list = Array.isArray(fx.coaches) ? fx.coaches : []

  const pick = (teamId: number): LineupCoach | null => {
    let best: { score: number; coach: LineupCoach } | null = null
    for (const item of list) {
      const row = rec(item)
      if (!row) continue
      const pid = Number(row.participant_id ?? row.team_id ?? rec(row.participant)?.id)
      if (pid !== teamId) continue
      const nested = rec(row.coach) ?? rec(rec(row.coach)?.data) ?? row
      const name = coachName(nested)
      if (!name) continue
      const photo = String(nested.image_path ?? '').trim()
      const score = typeScore(row)
      if (!best || score > best.score) {
        best = { score, coach: { name, photoUrl: photo || undefined } }
      }
    }
    return best?.coach ?? null
  }

  return { home: pick(sides.homeId), away: pick(sides.awayId) }
}
