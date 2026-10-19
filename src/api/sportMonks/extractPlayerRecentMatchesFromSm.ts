import { smIncludeRows } from './normalizeSmFixtureIncludes'
import { extractCurrentGoalsFromSmFixture } from './transformSportMonksToMatch'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'
import type { SmFixture, SmParticipant } from './types'

export type PlayerRecentMatch = {
  fixtureId: number
  kickoffAt: string
  opponent: string
  scoreHome: number
  scoreAway: number
  isHome: boolean
  result: 'W' | 'D' | 'L' | null
  minutes: number | null
  goals: number
  assists: number
  yellow: number
  red: number
  cameOn: boolean
  wentOff: boolean
}

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function teamShort(p: SmParticipant | undefined): string {
  const n = String(p?.name ?? '').trim()
  if (!n) return 'Adversaire'
  const parts = n.split(/\s+/).filter(Boolean)
  return parts.length <= 2 ? n : (parts[parts.length - 1] ?? n)
}

function typeDevName(d: Record<string, unknown>): string {
  const t = rec(d.type)
  return String(t?.developer_name ?? '').trim().toUpperCase()
}

function typeDisplayName(d: Record<string, unknown>): string {
  const t = rec(d.type)
  return String(t?.name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

function detailValue(d: Record<string, unknown>): number | null {
  const data = rec(d.data)
  return num(d.value ?? data?.value ?? data?.total ?? d.data)
}

/** Uniquement le code SM exact — `GOAL` dans `GOAL_KICKS` / `SHOTS_ON_GOAL` n’est pas un but. */
function pickExactStat(details: Record<string, unknown>[], names: string[]): number {
  const want = new Set(names.map((n) => n.toUpperCase()))
  for (const d of details) {
    if (!want.has(typeDevName(d))) continue
    const v = detailValue(d)
    if (v != null && v >= 0) return v
  }
  return 0
}

function pickMinutes(details: Record<string, unknown>[]): number | null {
  const exact = pickExactStat(details, ['MINUTES_PLAYED'])
  if (exact > 0) return exact
  for (const d of details) {
    const dev = typeDevName(d)
    const label = typeDisplayName(d)
    if (!dev.includes('MINUTE') && !label.includes('MINUTE')) continue
    if ((dev.includes('EXTRA') || label.includes('EXTRA')) && !dev.includes('PLAYED')) continue
    const v = detailValue(d)
    if (v != null && v >= 0) return v
  }
  return null
}

function appearanceTeamId(row: Record<string, unknown>): number | null {
  return num(row.team_id ?? row.participant_id ?? rec(row.team)?.id ?? rec(row.participant)?.id)
}

function asFixture(raw: unknown): SmFixture | null {
  const f = rec(raw)
  if (!f) return null
  const nested = rec(f.data) ?? f
  if (num(nested.id) == null) return null
  return {
    ...(nested as unknown as SmFixture),
    participants: smIncludeRows<SmParticipant>(nested.participants),
    scores: smIncludeRows(nested.scores),
  }
}

export function extractPlayerRecentMatchesFromSmPlayerPayload(
  payload: unknown,
  opts?: { excludeFixtureId?: number; limit?: number },
): PlayerRecentMatch[] {
  const root = rec(payload)
  if (!root) return []
  const player = rec(root.data) ?? (Array.isArray(root.data) ? rec(root.data[0]) : root)
  if (!player) return []
  const latest = smIncludeRows<Record<string, unknown>>(player.latest)
  const exclude = opts?.excludeFixtureId
  const limit = opts?.limit ?? 6
  const out: PlayerRecentMatch[] = []

  for (const row of latest) {
    const fixture = asFixture(row.fixture ?? rec(row.fixture)?.data)
    if (!fixture) continue
    const fixtureId = num(fixture.id)
    if (fixtureId == null) continue
    if (exclude != null && fixtureId === exclude) continue

    const sides = smFixtureHomeAwayParticipantIds(fixture)
    const teamId = appearanceTeamId(row)
    const isHome = teamId != null && teamId === sides.homeId
    const isAway = teamId != null && teamId === sides.awayId
    if (!isHome && !isAway) continue

    const score = extractCurrentGoalsFromSmFixture(fixture)
    if (!score) continue

    const parts = fixture.participants ?? []
    const homeP = parts.find((p) => p.id === sides.homeId)
    const awayP = parts.find((p) => p.id === sides.awayId)
    const opponent = isHome ? teamShort(awayP) : teamShort(homeP)
    const ours = isHome ? score.home : score.away
    const theirs = isHome ? score.away : score.home
    const result: PlayerRecentMatch['result'] =
      ours > theirs ? 'W' : ours < theirs ? 'L' : 'D'

    const details = smIncludeRows<Record<string, unknown>>(row.details)
    const minutes = pickMinutes(details)
    const goals = pickExactStat(details, ['GOALS'])
    const assists = pickExactStat(details, ['ASSISTS'])
    const yellow = pickExactStat(details, ['YELLOWCARDS', 'YELLOW_CARDS', 'YELLOWCARD'])
    const red = pickExactStat(details, ['REDCARDS', 'RED_CARDS', 'REDCARD'])
    const cameOn = details.some((d) => {
      const b = `${typeDevName(d)} ${typeDisplayName(d)}`
      return b.includes('SUBSTITUTE IN') || b.includes('SUB IN') || (b.includes('SUBSTITUT') && b.includes('IN'))
    })
    const wentOff = details.some((d) => {
      const b = `${typeDevName(d)} ${typeDisplayName(d)}`
      return b.includes('SUBSTITUTE OUT') || b.includes('SUB OUT') || (b.includes('SUBSTITUT') && b.includes('OUT'))
    })

    const kickoffAt = String(fixture.starting_at ?? fixture.name ?? '').trim()

    out.push({
      fixtureId,
      kickoffAt,
      opponent,
      scoreHome: score.home,
      scoreAway: score.away,
      isHome,
      result,
      minutes,
      goals,
      assists,
      yellow,
      red,
      cameOn,
      wentOff,
    })
  }

  out.sort((a, b) => Date.parse(b.kickoffAt) - Date.parse(a.kickoffAt) || b.fixtureId - a.fixtureId)
  return out.slice(0, limit)
}

export function minutesPlayedLabel(m: PlayerRecentMatch): string {
  if (m.minutes == null) return '—′'
  if (m.minutes >= 89 && !m.cameOn) return `${m.minutes}′ · tout le match`
  if (m.cameOn && m.wentOff) return `${m.minutes}′ · entré puis sorti`
  if (m.cameOn) return `${m.minutes}′ · entré`
  if (m.wentOff) return `${m.minutes}′ · sorti`
  if (m.minutes === 0) return '0′ · pas joué'
  return `${m.minutes}′`
}
