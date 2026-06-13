import type { Match, Team } from '../../types/match'
import { COMP_NAMES, inferTalkFootCompIdFromSmLeague, resolveTalkFootClubId } from '../footballApi'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import { findNationByName } from '../../data/nations'
import { teams, teamColors } from '../../data/teams'
import { isWorldCupCompetitionId } from '../../utils/seasonMode'
import { localizeMatchTeams } from '../../utils/matchSideColors'
import type { SmFixture, SmLeague, SmScoreRow } from './types'
import { normalizeSmFixtureIncludes } from './normalizeSmFixtureIncludes'

const LIVE_STATE_IDS = new Set([2, 3, 4, 6, 9, 21, 22, 25])
const FINISHED_STATE_IDS = new Set([5, 7, 8, 10, 12, 14, 15, 17])

export function inferCompIdFromLeague(league?: SmLeague | null): string {
  return inferTalkFootCompIdFromSmLeague(league)
}

function stateIdOf(f: SmFixture): number | undefined {
  return f.state?.id ?? f.state_id
}

/** États SM « 2e mi-temps » (≠ minute 68 — ancien bug affichait 68 dès le state 22). */
const SECOND_HALF_STATE_IDS = new Set([4, 6, 9, 21, 22, 25])

function periodMinuteTotal(p: NonNullable<SmFixture['periods']>[number]): number | null {
  if (typeof p.minutes !== 'number' || p.minutes < 0) return null
  const base = typeof p.counts_from === 'number' && p.counts_from >= 0 ? p.counts_from : 0
  return base + p.minutes
}

function minuteFromPeriods(f: SmFixture): number | null {
  const periods = f.periods
  if (!Array.isArray(periods) || !periods.length) return null
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i]
    if (p?.ticking) {
      const total = periodMinuteTotal(p)
      if (total != null) return total
    }
  }
  for (let i = periods.length - 1; i >= 0; i--) {
    const total = periodMinuteTotal(periods[i])
    if (total != null) return total
  }
  return null
}

export function livePeriodTickingFromSmFixture(f: SmFixture): boolean {
  const periods = f.periods
  if (!Array.isArray(periods)) return false
  return periods.some((p) => Boolean(p?.ticking))
}

/** 2e période en cours (pour afficher 46' vs 45+1). */
export function liveSecondHalfFromSmFixture(f: SmFixture): boolean {
  if (liveClockPausedFromSmFixture(f)) {
    const sid = stateIdOf(f)
    return sid != null && SECOND_HALF_STATE_IDS.has(sid)
  }

  const periods = f.periods
  if (Array.isArray(periods) && periods.length) {
    const ticking = periods.find((p) => p?.ticking)
    const ref = ticking ?? periods[periods.length - 1]
    if (ref) {
      const countsFrom = typeof ref.counts_from === 'number' ? ref.counts_from : 0
      if (countsFrom >= 45) return true
      if (countsFrom === 0) return false
    }
  }

  const sid = stateIdOf(f)
  if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) return true
  if (sid === 3) return false

  const total = minuteFromFixture(f)
  return total > 50
}

/** Mi-temps / pause : calé sur SportMonks (périodes + état), sans extrapolation client. */
export function liveClockPausedFromSmFixture(f: SmFixture): boolean {
  const sid = stateIdOf(f)
  const blob = `${f.state?.developer_name ?? ''} ${f.state?.state ?? ''}`.toUpperCase()

  if (Array.isArray(f.periods) && f.periods.some((p) => p?.ticking)) return false

  if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) {
    const apiMin = typeof f.minute === 'number' ? f.minute : minuteFromPeriods(f)
    if (apiMin != null && apiMin >= 46) return false
  }

  if (blob.includes('HT') || blob.includes('HALF')) {
    if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) return false
    return true
  }
  if (sid === 3) return true

  /** Fin 1re période, horloge arrêtée → mi-temps (même si le libellé HT tarde). */
  if (Array.isArray(f.periods) && f.periods.length > 0) {
    if (f.periods.some((p) => Boolean(p?.ticking) && typeof p.counts_from === 'number' && p.counts_from >= 45)) {
      return false
    }
    if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) return false

    const maxTotal = f.periods.reduce((acc, p) => {
      const t = periodMinuteTotal(p)
      return t != null ? Math.max(acc, t) : acc
    }, 0)
    if (maxTotal >= 45) return true
  }

  return false
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
  homeLogoUrl?: string
  awayLogoUrl?: string
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
  let homeLogoUrl: string | undefined
  let awayLogoUrl: string | undefined
  for (const p of parts) {
    const loc = p.meta?.location?.toLowerCase()
    if (loc === 'home') {
      home = p.name ?? ''
      if (typeof p.id === 'number') homeSmId = p.id
      if (typeof p.image_path === 'string' && p.image_path.trim()) homeLogoUrl = p.image_path.trim()
      else if (typeof p.logo_path === 'string' && p.logo_path.trim()) homeLogoUrl = p.logo_path.trim()
    }
    if (loc === 'away') {
      away = p.name ?? ''
      if (typeof p.id === 'number') awaySmId = p.id
      if (typeof p.image_path === 'string' && p.image_path.trim()) awayLogoUrl = p.image_path.trim()
      else if (typeof p.logo_path === 'string' && p.logo_path.trim()) awayLogoUrl = p.logo_path.trim()
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
  return { home, away, homeSmId, awaySmId, homeLogoUrl, awayLogoUrl }
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
      const gn = g == null ? NaN : Number(g)
      if (!Number.isFinite(gn)) continue
      if (part === 'home') home = Math.max(home, gn)
      if (part === 'away') away = Math.max(away, gn)
    }
    if (home !== 0 || away !== 0) return { home, away }
    const sawSide = currentRows.some((s) => {
      const g = s.score?.goals
      const part = String(s.score?.participant ?? '').toLowerCase()
      return (part === 'home' || part === 'away') && g != null && Number.isFinite(Number(g))
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
    const gn = g == null ? NaN : Number(g)
    if (!Number.isFinite(gn)) continue
    if (part === 'home') home = Math.max(home, gn)
    if (part === 'away') away = Math.max(away, gn)
  }
  if (home !== 0 || away !== 0) return { home, away }
  home = 0
  away = 0
  const fallbackPool = rest.length ? rest.filter((s) => !isPartialPeriodScoreRow(s)) : scores.filter((s) => !isPartialPeriodScoreRow(s))
  for (const s of fallbackPool.length ? fallbackPool : scores) {
    const g = s.score?.goals
    const part = String(s.score?.participant ?? '').toLowerCase()
    const gn = g == null ? NaN : Number(g)
    if (!Number.isFinite(gn)) continue
    if (part === 'home') home = Math.max(home, gn)
    if (part === 'away') away = Math.max(away, gn)
  }
  if (home !== 0 || away !== 0) return { home, away }
  const sawSide = scores.some((s) => {
    const g = s.score?.goals
    const part = String(s.score?.participant ?? '').toLowerCase()
    return (part === 'home' || part === 'away') && g != null && Number.isFinite(Number(g))
  })
  return sawSide ? { home: 0, away: 0 } : undefined
}

/** Score courant (lignes `CURRENT` / live SM) — rafraîchissement encart sans repasser par `smFixtureToMatch`. */
export function extractCurrentGoalsFromSmFixture(f: SmFixture): { home: number; away: number } | undefined {
  return goalsFromScores(f.scores)
}

function minuteFromFixture(f: SmFixture): number {
  const fromPeriods = minuteFromPeriods(f)
  if (fromPeriods != null) return fromPeriods
  if (typeof f.minute === 'number' && f.minute >= 0) return f.minute
  /** Pas d’estimation depuis starting_at (retard / mi-temps ≠ horloge réelle). */
  return 0
}

/** Minute affichée (période / `fixture.minute`) pour caler l’encart sur le live SM. */
export function extractLiveMinuteFromSmFixture(f: SmFixture): number {
  const fx = normalizeSmFixtureIncludes(f) ?? f
  return minuteFromFixture(fx)
}

function getTeam(
  compId: string,
  apiName: string,
  sportMonksTeamId?: number,
  logoUrl?: string,
): Team {
  const ourId = resolveTalkFootClubId({ apiName, sportMonksTeamId })
  const resolvedLogo = resolveTeamLogoUrl(ourId, { apiLogoUrl: logoUrl, sportMonksTeamId })
  const compTeams = teams[compId as keyof typeof teams]
  const sm = {
    ...(sportMonksTeamId != null ? { sportMonksTeamId } : {}),
    ...(resolvedLogo ? { logoUrl: resolvedLogo } : {}),
  }
  const nation = isWorldCupCompetitionId(compId) ? findNationByName(apiName) : null
  if (nation) {
    return {
      id: ourId,
      name: nation.nameFr,
      shortName: nation.iso,
      colors: { primary: nation.primary, secondary: nation.secondary },
      ...sm,
    }
  }
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
  const { home: hn, away: an, homeSmId, awaySmId, homeLogoUrl, awayLogoUrl } = namesFromParticipants(f)
  const home = getTeam(compId, hn, homeSmId, homeLogoUrl)
  const away = getTeam(compId, an, awaySmId, awayLogoUrl)
  const statusFromProvider = smStatus(f)
  const id = `m-sm-${f.id}`
  const kickoffAt = startingAtIso(f)
  const kickoffMs = Date.parse(kickoffAt)
  const nowMs = Date.now()
  const hasFutureKickoff = Number.isFinite(kickoffMs) && kickoffMs > nowMs + 60_000
  // Garde-fou: certaines fixtures SM peuvent exposer un état "finished" alors que
  // la date de coup d'envoi est encore future; on évite d'afficher un faux "Terminé".
  const status = hasFutureKickoff && statusFromProvider === 'finished' ? 'upcoming' : statusFromProvider
  const score = goalsFromScores(f.scores)

  const roundId =
    typeof f.round?.id === 'number'
      ? f.round.id
      : typeof f.round_id === 'number'
        ? f.round_id
        : undefined
  const roundName = f.round?.name?.trim() || undefined
  const stageName = f.stage?.name?.trim() || undefined
  const venueName = f.venue?.name?.trim() || undefined

  const base: Match = {
    id,
    competition: { id: compId, name: comp.name, shortName: comp.shortName },
    home,
    away,
    kickoffAt,
    status,
    provider: 'sportmonks',
    sportMonksFixtureId: f.id,
    ...(roundId != null ? { sportMonksRoundId: roundId } : {}),
    ...(roundName ? { roundName } : {}),
    ...(stageName ? { stageName } : {}),
    ...(venueName ? { venueName } : {}),
  }

  if (status === 'live') {
    return localizeMatchTeams({
      ...base,
      minute: minuteFromFixture(f),
      score: score ?? { home: 0, away: 0 },
      liveClockPaused: liveClockPausedFromSmFixture(f),
      liveInSecondHalf: liveSecondHalfFromSmFixture(f),
    })
  }
  if (status === 'finished' && score) {
    return localizeMatchTeams({ ...base, score })
  }
  return localizeMatchTeams(base)
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
