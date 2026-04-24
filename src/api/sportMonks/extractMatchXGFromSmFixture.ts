import type { SmFixture, SmXGFixtureRow } from './types'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type SmMatchXGTotals = { home: number; away: number }

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function parseXGValue(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'))
  if (!Number.isFinite(n) || n < 0 || n > 20) return null
  return n
}

function xgRows(fixture: SmFixture): SmXGFixtureRow[] {
  const a = fixture.xGfixture ?? fixture.xgfixture
  return Array.isArray(a) ? a : []
}

/**
 * Agrège les xG par équipe à partir de `xGfixture` (+ participants pour résoudre domicile / extérieur).
 */
export function extractMatchXGFromFixture(fixture: SmFixture): SmMatchXGTotals | null {
  const rows = xgRows(fixture)
  if (!rows.length) return null

  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  if (homeId == null || awayId == null) return null

  let home = 0
  let away = 0
  let saw = false

  for (const r of rows) {
    const v = parseXGValue(r.value)
    if (v == null) continue

    const pidRaw = r.participant_id ?? r.team_id
    const pid = typeof pidRaw === 'number' ? pidRaw : Number(pidRaw)
    if (Number.isFinite(pid)) {
      if (pid === homeId) {
        home += v
        saw = true
        continue
      }
      if (pid === awayId) {
        away += v
        saw = true
        continue
      }
    }

    const loc = String(r.location ?? '').toLowerCase()
    if (loc === 'home') {
      home += v
      saw = true
    } else if (loc === 'away') {
      away += v
      saw = true
    }
  }

  if (!saw) return null
  if (home === 0 && away === 0) return null
  return { home: round1(home), away: round1(away) }
}
