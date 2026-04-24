import type { SmFixture, SmFixtureStatistic } from './types'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type LiveFixtureStatRow = {
  /** Clé stable (developer_name SM en minuscules). */
  key: string
  label: string
  home: number
  away: number
}

function parseStatNumber(raw: number | string | null | undefined): number | null {
  if (raw == null) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return n
}

function statNumericValue(row: SmFixtureStatistic): number | null {
  const d = row.data
  const fromData = parseStatNumber(d?.value ?? d?.total)
  if (fromData != null) return fromData
  return parseStatNumber(row.value)
}

function normTypeKey(row: SmFixtureStatistic): string {
  const dev = String(row.type?.developer_name ?? '').trim()
  if (dev) return dev.toLowerCase()
  return String(row.type?.name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

const STAT_LABEL_FR: Record<string, string> = {
  ball_possession: 'Possession',
  possession: 'Possession',
  shots_total: 'Tirs',
  shots: 'Tirs',
  shots_on_target: 'Tirs cadrés',
  shotsontarget: 'Tirs cadrés',
  corners: 'Corners',
  fouls: 'Fautes',
  offsides: 'Hors-jeu',
  yellowcards: 'Cartons jaunes',
  yellow_cards: 'Cartons jaunes',
  redcards: 'Cartons rouges',
  red_cards: 'Cartons rouges',
  attacks: 'Attaques',
  dangerous_attacks: 'Attaques dangereuses',
  goal_kicks: 'Dégagements six mètres',
  throwins: 'Touches',
  saves: 'Arrêts',
  substitutions: 'Changements',
  passes_total: 'Passes',
  successful_passes_percentage: 'Passes réussies %',
}

const DISPLAY_ORDER: string[] = [
  'ball_possession',
  'possession',
  'shots_total',
  'shots',
  'shots_on_target',
  'shotsontarget',
  'corners',
  'fouls',
  'offsides',
  'yellowcards',
  'yellow_cards',
  'redcards',
  'red_cards',
  'attacks',
  'dangerous_attacks',
  'saves',
  'goal_kicks',
  'throwins',
  'substitutions',
  'passes_total',
  'successful_passes_percentage',
]

/**
 * Statistiques fixture par équipe (domicile / extérieur), à partir de `statistics` + `participants`.
 */
export function extractLiveFixtureStatistics(fixture: SmFixture): LiveFixtureStatRow[] {
  const rows = fixture.statistics
  if (!Array.isArray(rows) || !rows.length) return []

  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  if (homeId == null || awayId == null) return []

  const merged = new Map<string, { home: number; away: number; label: string }>()

  for (const s of rows) {
    const key = normTypeKey(s)
    if (!key) continue

    const v = statNumericValue(s)
    if (v == null) continue

    const pidRaw = s.participant_id ?? s.team_id
    const pid = typeof pidRaw === 'number' ? pidRaw : Number(pidRaw)
    const loc = String(s.location ?? '').toLowerCase()

    let side: 'home' | 'away' | null = null
    if (Number.isFinite(pid)) {
      if (pid === homeId) side = 'home'
      else if (pid === awayId) side = 'away'
    }
    if (!side) {
      if (loc === 'home') side = 'home'
      else if (loc === 'away') side = 'away'
    }
    if (!side) continue

    const label =
      STAT_LABEL_FR[key] ??
      (s.type?.name?.trim() || s.type?.developer_name?.trim() || key).replace(/_/g, ' ')

    const cur = merged.get(key) ?? { home: 0, away: 0, label }
    if (side === 'home') cur.home += v
    else cur.away += v
    cur.label = label
    merged.set(key, cur)
  }

  const ordered: LiveFixtureStatRow[] = []
  const seen = new Set<string>()
  for (const k of DISPLAY_ORDER) {
    const m = merged.get(k)
    if (!m) continue
    ordered.push({ key: k, label: m.label, home: roundStat(m.home), away: roundStat(m.away) })
    seen.add(k)
  }
  for (const [key, m] of merged) {
    if (seen.has(key)) continue
    ordered.push({ key, label: m.label, home: roundStat(m.home), away: roundStat(m.away) })
  }
  return ordered
}

function roundStat(n: number): number {
  return Math.round(n * 10) / 10
}
