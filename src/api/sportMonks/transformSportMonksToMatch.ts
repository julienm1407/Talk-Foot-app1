import type { Match, Team } from '../../types/match'
import { apiNameToOurId, COMP_NAMES, inferTalkFootCompIdFromSmLeague } from '../footballApi'
import { teams, teamColors } from '../../data/teams'
import type { SmFixture, SmLeague, SmScoreRow } from './types'

const LIVE_STATE_IDS = new Set([2, 3, 4, 6, 9, 21, 22, 25])
const FINISHED_STATE_IDS = new Set([5, 7, 8, 10, 12, 14, 15, 17])

export function inferCompIdFromLeague(league?: SmLeague | null): string {
  return inferTalkFootCompIdFromSmLeague(league)
}

function stateIdOf(f: SmFixture): number | undefined {
  return f.state?.id ?? f.state_id
}

/** Ligue pour le mapping compétition : SM envoie parfois seulement `league_id` sur la fixture. */
function leagueForInfer(f: SmFixture): SmLeague | null {
  const lid = f.league?.id ?? f.league_id
  if (f.league && (lid != null || f.league.name || f.league.short_code)) {
    return { ...f.league, id: lid ?? f.league.id }
  }
  if (lid != null) return { id: lid }
  return f.league ?? null
}

export function smStatus(f: SmFixture): 'upcoming' | 'live' | 'finished' {
  const dev = (f.state?.developer_name || f.state?.state || '').toUpperCase()
  if (dev.includes('INPLAY') || dev.includes('LIVE') || dev.includes('PENALT')) return 'live'
  if (dev.includes('FT') || dev.includes('AET') || dev.includes('FINISHED') || dev.includes('FULL')) {
    return 'finished'
  }
  const sid = stateIdOf(f)
  if (sid != null) {
    if (FINISHED_STATE_IDS.has(sid)) return 'finished'
    if (LIVE_STATE_IDS.has(sid)) return 'live'
  }
  return 'upcoming'
}

function startingAtIso(f: SmFixture): string {
  const raw = f.starting_at_timestamp
  if (raw != null && String(raw).trim() !== '') {
    const n = typeof raw === 'string' ? Number(raw) : Number(raw)
    if (Number.isFinite(n)) {
      const ms = n < 1e12 ? n * 1000 : n
      return new Date(ms).toISOString()
    }
  }
  const s = f.starting_at?.trim()
  if (!s) return new Date().toISOString()
  if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  if (s.includes('T')) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  const asUtc = new Date(`${s.replace(' ', 'T')}Z`)
  return Number.isNaN(asUtc.getTime()) ? new Date().toISOString() : asUtc.toISOString()
}

function namesFromParticipants(f: SmFixture): {
  home: string
  away: string
  homeSmId?: number
  awaySmId?: number
} {
  const parts = f.participants
  if (!Array.isArray(parts) || parts.length < 2) {
    const raw = f.name ?? 'Home vs Away'
    const bits = raw.split(/\s+vs\.?\s+/i)
    return {
      home: (bits[0] ?? 'Home').trim(),
      away: (bits[1] ?? 'Away').trim(),
    }
  }
  let home = ''
  let away = ''
  let homeSmId: number | undefined
  let awaySmId: number | undefined
  for (const p of parts) {
    const loc = p.meta?.location?.toLowerCase()
    if (loc === 'home') {
      home = p.name ?? ''
      if (typeof p.id === 'number') homeSmId = p.id
    }
    if (loc === 'away') {
      away = p.name ?? ''
      if (typeof p.id === 'number') awaySmId = p.id
    }
  }
  if (!home || !away) {
    const raw = f.name ?? ''
    const bits = raw.split(/\s+vs\.?\s+/i)
    return {
      home: home || (bits[0] ?? 'Home').trim(),
      away: away || (bits[1] ?? 'Away').trim(),
    }
  }
  return { home, away, homeSmId, awaySmId }
}

function isPartialPeriodScoreRow(s: SmScoreRow): boolean {
  const d = String(s.description ?? '').toUpperCase()
  return d === '1ST_HALF' || d === '2ND_HALF_ONLY' || d === '2ND_HALF'
}

/** Score affichable : d’abord les lignes `CURRENT` (total match côté SM), jamais les agrégats de mi-temps seuls. */
function goalsFromScores(scores: SmScoreRow[] | undefined): { home: number; away: number } | undefined {
  if (!scores?.length) return undefined

  const currentRows = scores.filter((s) => String(s.description ?? '').toUpperCase() === 'CURRENT')
  if (currentRows.length) {
    let home = 0
    let away = 0
    for (const s of currentRows) {
      const g = s.score?.goals
      const part = String(s.score?.participant ?? '').toLowerCase()
      if (g == null || Number.isNaN(Number(g))) continue
      if (part === 'home') home = Math.max(home, g)
      if (part === 'away') away = Math.max(away, g)
    }
    if (home !== 0 || away !== 0) return { home, away }
    const sawSide = currentRows.some((s) => {
      const g = s.score?.goals
      const part = String(s.score?.participant ?? '').toLowerCase()
      return (part === 'home' || part === 'away') && g != null && !Number.isNaN(Number(g))
    })
    if (sawSide) return { home: 0, away: 0 }
  }

  const tagged: SmScoreRow[] = []
  const rest: SmScoreRow[] = []
  for (const s of scores) {
    const blob = `${s.description ?? ''} ${s.type?.developer_name ?? ''} ${s.type?.name ?? ''}`.toUpperCase()
    if (blob.includes('CURRENT') || blob.includes('LIVE') || /\bINPLAY\b/.test(blob)) {
      tagged.push(s)
    } else {
      rest.push(s)
    }
  }
  const pool = tagged.length ? tagged : scores.filter((s) => !isPartialPeriodScoreRow(s))
  let home = 0
  let away = 0
  for (const s of pool) {
    const g = s.score?.goals
    const part = String(s.score?.participant ?? '').toLowerCase()
    if (g == null || Number.isNaN(Number(g))) continue
    if (part === 'home') home = Math.max(home, g)
    if (part === 'away') away = Math.max(away, g)
  }
  if (home !== 0 || away !== 0) return { home, away }
  home = 0
  away = 0
  const fallbackPool = rest.length ? rest.filter((s) => !isPartialPeriodScoreRow(s)) : scores.filter((s) => !isPartialPeriodScoreRow(s))
  for (const s of fallbackPool.length ? fallbackPool : scores) {
    const g = s.score?.goals
    const part = String(s.score?.participant ?? '').toLowerCase()
    if (g == null || Number.isNaN(Number(g))) continue
    if (part === 'home') home = Math.max(home, g)
    if (part === 'away') away = Math.max(away, g)
  }
  if (home !== 0 || away !== 0) return { home, away }
  const sawSide = scores.some((s) => {
    const g = s.score?.goals
    const part = String(s.score?.participant ?? '').toLowerCase()
    return (part === 'home' || part === 'away') && g != null && !Number.isNaN(Number(g))
  })
  return sawSide ? { home: 0, away: 0 } : undefined
}

function minuteFromFixture(f: SmFixture): number {
  if (typeof f.minute === 'number' && f.minute >= 0) return f.minute
  const periods = f.periods
  if (Array.isArray(periods)) {
    for (let i = periods.length - 1; i >= 0; i--) {
      const p = periods[i]
      if (p?.ticking && typeof p.minutes === 'number') return p.minutes
    }
    const last = periods[periods.length - 1]
    if (typeof last?.minutes === 'number') return last.minutes
  }
  const sid = stateIdOf(f)
  if (sid === 3) return 45
  if (sid === 2) return 25
  if (sid === 22) return 68
  return 0
}

function getTeam(
  compId: string,
  apiName: string,
  sportMonksTeamId?: number,
): Team {
  const ourId = apiNameToOurId(apiName)
  const compTeams = teams[compId as keyof typeof teams]
  const sm = sportMonksTeamId != null ? { sportMonksTeamId } : {}
  if (!compTeams) {
    return {
      id: ourId,
      name: apiName,
      shortName: apiName.slice(0, 3).toUpperCase(),
      colors: { primary: '#111827', secondary: '#f9fafb' },
      ...sm,
    }
  }
  const t = compTeams.find((x) => x.id === ourId)
  if (t) return { ...t, ...sm }
  const [primary, secondary] = teamColors[ourId] ?? ['#111827', '#f9fafb']
  return {
    id: ourId,
    name: apiName,
    shortName: apiName.slice(0, 3).toUpperCase(),
    colors: { primary, secondary },
    ...sm,
  }
}

/** Convertit une fixture / livescore SportMonks en `Match` interne. */
export function smFixtureToMatch(f: SmFixture): Match {
  const lg = leagueForInfer(f)
  const compId = inferCompIdFromLeague(lg)
  const comp = COMP_NAMES[compId] ?? {
    name: lg?.name ?? f.league?.name ?? 'Compétition',
    shortName: (lg?.short_code ?? f.league?.short_code ?? f.league?.name ?? '?')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5)
      .toUpperCase() || '?',
  }
  const { home: hn, away: an, homeSmId, awaySmId } = namesFromParticipants(f)
  const home = getTeam(compId, hn, homeSmId)
  const away = getTeam(compId, an, awaySmId)
  const status = smStatus(f)
  const id = `m-sm-${f.id}`
  const kickoffAt = startingAtIso(f)
  const score = goalsFromScores(f.scores)

  const base: Match = {
    id,
    competition: { id: compId, name: comp.name, shortName: comp.shortName },
    home,
    away,
    kickoffAt,
    status,
    provider: 'sportmonks',
    sportMonksFixtureId: f.id,
  }

  if (status === 'live') {
    return {
      ...base,
      minute: minuteFromFixture(f),
      score: score ?? { home: 0, away: 0 },
    }
  }
  if (status === 'finished' && score) {
    return { ...base, score }
  }
  return base
}

/** Fusionne calendrier + inplay : les entrées inplay remplacent le même `id` fixture. */
export function mergeSportMonksFixtureLists(
  fromBetween: SmFixture[],
  fromInplay: SmFixture[],
): SmFixture[] {
  const map = new Map<number, SmFixture>()
  for (const f of fromBetween) {
    map.set(f.id, f)
  }
  for (const f of fromInplay) {
    map.set(f.id, f)
  }
  return Array.from(map.values())
}
