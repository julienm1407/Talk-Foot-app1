import type { Highlight } from '../data/highlights'
import type { SmFixture, SmLineupRow } from '../api/sportMonks/types'
import { isPlausibleGoalScorerName, slugScorer } from './liveFootballOdds'

export type MotmCandidate = {
  name: string
  goals: number
  assists: number
  saves: number
  rating: number | null
  played: boolean
}

function slug(name: string): string {
  return slugScorer(name)
}

function preferName(a: string, b: string): string {
  const left = a.trim()
  const right = b.trim()
  const leftOk = isPlausibleGoalScorerName(left)
  const rightOk = isPlausibleGoalScorerName(right)
  if (rightOk && !leftOk) return right
  if (!rightOk && leftOk) return left
  if (rightOk && right.length > left.length) return right
  return left
}

function lineupPlayerName(row: SmLineupRow): string {
  return String(row.player?.display_name ?? row.player?.name ?? '').trim()
}

function lineupDetail(row: SmLineupRow, names: string[]): number {
  const want = new Set(names.map((n) => n.toUpperCase()))
  for (const d of row.details ?? []) {
    const dev = String(d.type?.developer_name ?? d.type?.name ?? '').toUpperCase()
    if (!want.has(dev)) continue
    const n = Number(d.value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function isStarterRow(row: SmLineupRow): boolean {
  const field = String(row.formation_field ?? '').trim()
  if (field) return true
  const pos = row.formation_position
  return typeof pos === 'number' && pos >= 1 && pos <= 11
}

function bump(
  map: Map<string, MotmCandidate>,
  name: string,
  patch: {
    addGoals?: number
    addAssists?: number
    assists?: number
    saves?: number
    rating?: number | null
    played?: boolean
  },
): void {
  const trimmed = name.trim()
  if (!trimmed || !isPlausibleGoalScorerName(trimmed)) return
  const key = slug(trimmed)
  if (!key) return
  const cur = map.get(key) ?? {
    name: name.trim(),
    goals: 0,
    assists: 0,
    saves: 0,
    rating: null,
    played: false,
  }
  const assistsFromEvents = cur.assists + (patch.addAssists ?? 0)
  map.set(key, {
    name: preferName(cur.name, trimmed),
    goals: cur.goals + (patch.addGoals ?? 0),
    assists: Math.max(assistsFromEvents, patch.assists ?? 0),
    saves: Math.max(cur.saves, patch.saves ?? 0),
    rating:
      patch.rating != null
        ? Math.max(cur.rating ?? 0, patch.rating)
        : cur.rating,
    played: cur.played || Boolean(patch.played),
  })
}

function motmScore(c: MotmCandidate): number {
  const brace = c.goals >= 2 ? 45 : 0
  const combo = c.goals >= 1 && c.assists >= 1 ? 28 : 0
  const keep = c.saves >= 4 ? c.saves * 9 : c.saves >= 1 ? c.saves * 4 : 0
  const note = c.rating != null && c.rating >= 7 ? (c.rating - 6) * 12 : 0
  return c.goals * 52 + brace + c.assists * 30 + combo + keep + note + (c.played ? 0.2 : 0)
}

function isStandout(c: MotmCandidate): boolean {
  return (
    c.goals >= 1 ||
    c.assists >= 1 ||
    c.saves >= 3 ||
    (c.rating != null && c.rating >= 7.3)
  )
}

/** Noms pour le sondage homme du match : d’abord ceux qui ont pesé, puis le reste des joueurs. */
export function rankMotmPollNames(input: {
  homeStarters: string[]
  awayStarters: string[]
  highlights?: Highlight[]
  fixture?: SmFixture | null
  max?: number
}): string[] {
  const max = input.max ?? 18
  const map = new Map<string, MotmCandidate>()

  for (const name of [...input.homeStarters, ...input.awayStarters]) {
    bump(map, name, { played: true })
  }

  for (const h of input.highlights ?? []) {
    if (h.ownGoal) continue
    const isGoal = h.type === 'But' || /\b(goal|scored|marque)\b/i.test(`${h.title ?? ''} ${h.detail ?? ''}`)
    if (isGoal && h.scorerName) bump(map, h.scorerName, { addGoals: 1, played: true })
    if (h.assistName) bump(map, h.assistName, { addAssists: 1, played: true })
  }

  const fx = input.fixture
  if (fx) {
    for (const row of fx.lineups ?? []) {
      const name = lineupPlayerName(row)
      if (!name) continue
      const saves = lineupDetail(row, ['SAVES', 'GOALKEEPER_SAVES'])
      const rating = lineupDetail(row, ['RATING'])
      const assists = lineupDetail(row, ['ASSISTS'])
      const starter = isStarterRow(row)
      bump(map, name, {
        played: starter,
        saves,
        assists,
        rating: rating > 0 ? rating : null,
      })
    }
    for (const ev of fx.events ?? []) {
      const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').toUpperCase()
      if (!dev.includes('SUBSTITUTION') && !dev.includes('SUBS')) continue
      const onName = String(
        ev.player?.display_name ?? ev.player?.name ?? ev.player_name ?? '',
      ).trim()
      if (onName) bump(map, onName, { played: true })
    }
  }

  const all = [...map.values()].filter((c) => c.name.trim())
  all.sort((a, b) => motmScore(b) - motmScore(a) || a.name.localeCompare(b.name, 'fr'))

  const standouts = all.filter(isStandout)
  const restPlayed = all.filter((c) => !isStandout(c) && c.played)
  const rest = all.filter((c) => !isStandout(c) && !c.played)
  const ordered = [...standouts, ...restPlayed, ...rest]

  const out: string[] = []
  const seen = new Set<string>()
  for (const c of ordered) {
    const key = slug(c.name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(c.name)
    if (out.length >= max) break
  }
  return out
}
