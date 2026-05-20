import type { SmFixture } from './types'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type SidelinedCounts = { home: number; away: number }

function isKeyAbsenceType(raw: string): boolean {
  const t = raw.toLowerCase()
  return (
    t.includes('injur') ||
    t.includes('susp') ||
    t.includes('ban') ||
    t.includes('doubt') ||
    t.includes('ill') ||
    t.includes('bless') ||
    t.includes('absent')
  )
}

/**
 * Compte les absences importantes (blessure / suspension) par camp.
 * `sidelined` est inclus dans le live-bundle / events SM.
 */
export function extractSidelinedCountsFromSmFixture(fixture: SmFixture | null | undefined): SidelinedCounts {
  const empty = { home: 0, away: 0 }
  if (!fixture) return empty
  const sides = smFixtureHomeAwayParticipantIds(fixture)
  if (!sides) return empty

  const raw = (fixture as { sidelined?: unknown }).sidelined
  const list = Array.isArray(raw) ? raw : []
  let home = 0
  let away = 0

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const teamId = Number(row.team_id ?? row.participant_id)
    const sideline = row.sideline
    let typeLabel = ''
    if (sideline && typeof sideline === 'object') {
      const st = (sideline as Record<string, unknown>).type
      if (st && typeof st === 'object') {
        const sto = st as Record<string, unknown>
        typeLabel = String(sto.name ?? sto.developer_name ?? '')
      }
    }
    if (!typeLabel) typeLabel = String(row.type ?? '')
    if (typeLabel && !isKeyAbsenceType(typeLabel)) continue

    if (teamId === sides.homeId) home += 1
    else if (teamId === sides.awayId) away += 1
  }

  return { home: Math.min(home, 6), away: Math.min(away, 6) }
}
