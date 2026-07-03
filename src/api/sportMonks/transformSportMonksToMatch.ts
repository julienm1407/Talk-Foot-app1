import type { Match, Team } from '../../types/match'
import { COMP_NAMES, inferTalkFootCompIdFromSmLeague, resolveTalkFootClubId } from '../footballApi'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import { findNationByName } from '../../data/nations'
import { teams, teamColors } from '../../data/teams'
import { isWorldCupCompetitionId } from '../../utils/seasonMode'
import { localizeMatchTeams } from '../../utils/matchSideColors'
import { eventMinuteTotal, type SmEventMinuteRow } from '../../utils/matchEventMinute'
import { extractRegulationGoalsFromScores } from '../../utils/matchRegulationScore'
import type { SmFixture, SmLeague, SmScoreRow } from './types'
import { normalizeSmFixtureIncludes } from './normalizeSmFixtureIncludes'

const LIVE_STATE_IDS = new Set([2, 3, 4, 6, 9, 21, 22, 25])
const FINISHED_STATE_IDS = new Set([5, 7, 8, 10, 12, 14, 15, 17])

function asClockFixture(f: SmFixture): SmFixture {
  return normalizeSmFixtureIncludes(f) ?? f
}

export function inferCompIdFromLeague(league?: SmLeague | null): string {
  return inferTalkFootCompIdFromSmLeague(league)
}

function stateIdOf(f: SmFixture): number | undefined {
  return f.state?.id ?? f.state_id
}

/** États SM « 2e mi-temps » (≠ minute 68 — ancien bug affichait 68 dès le state 22). */
const SECOND_HALF_STATE_IDS = new Set([4, 6, 9, 21, 22, 25])

type SmPeriodRow = NonNullable<SmFixture['periods']>[number]

function periodCountsFrom(p: SmPeriodRow): number {
  return typeof p.counts_from === 'number' && p.counts_from >= 0 ? p.counts_from : 0
}

/** Minute cumulée depuis la ligne `periods` SM (cumulée ou locale selon la période). */
function periodMinuteTotal(p: SmPeriodRow): number | null {
  if (typeof p.minutes !== 'number' || p.minutes < 0) return null
  const base = periodCountsFrom(p)
  // SM envoie souvent la minute cumulée (ex. 50 en 1re MT, 96 en 2e) — ne pas re-ajouter counts_from.
  if (base > 0 && p.minutes >= base) return p.minutes
  return base + p.minutes
}

/** Horloge live quand `has_timer` est false : SM garde `minutes` à 0 mais fournit `started`. */
function minuteFromPeriodStarted(p: SmPeriodRow, nowMs = Date.now()): number | null {
  if (!p?.ticking) return null
  const started = p.started
  if (typeof started !== 'number' || started <= 0) return null
  const elapsedMin = Math.floor(nowMs / 1000 - started) / 60
  if (!Number.isFinite(elapsedMin) || elapsedMin < 0) return null
  return Math.min(99, periodCountsFrom(p) + Math.floor(elapsedMin))
}

function periodMinuteValue(p: SmPeriodRow, nowMs = Date.now()): number | null {
  const fromSm = periodMinuteTotal(p)
  if (!p?.ticking) return fromSm

  // Horloge SM fiable : ne jamais préférer un elapsed wall-clock (mi-temps incluse).
  if (typeof p.minutes === 'number' && p.minutes > 0) return fromSm

  const fromStarted = minuteFromPeriodStarted(p, nowMs)
  if (fromStarted == null) return fromSm
  if (fromSm == null || fromSm <= 0) return fromStarted
  return fromSm
}

function minuteFromPeriods(f: SmFixture, nowMs = Date.now()): number | null {
  const periods = f.periods
  if (!Array.isArray(periods) || !periods.length) return null
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i]
    if (p?.ticking) {
      const total = periodMinuteValue(p, nowMs)
      if (total != null) return total
    }
  }
  let best: number | null = null
  for (let i = periods.length - 1; i >= 0; i--) {
    const total = periodMinuteValue(periods[i], nowMs)
    if (total == null) continue
    best = best == null ? total : Math.max(best, total)
  }
  return best
}

function minuteFromFeedRows(rows: SmEventMinuteRow[]): number | null {
  if (!rows.length) return null
  let max = 0
  for (const row of rows) {
    const total = eventMinuteTotal(row)
    if (total > max) max = total
  }
  return max > 0 ? max : null
}

function minuteFromEvents(f: SmFixture): number | null {
  const events = f.events
  if (!Array.isArray(events) || !events.length) return null
  return minuteFromFeedRows(events)
}

function minuteFromComments(f: SmFixture): number | null {
  const comments = f.comments
  if (!Array.isArray(comments) || !comments.length) return null
  return minuteFromFeedRows(comments)
}

export function livePeriodTickingFromSmFixture(f: SmFixture): boolean {
  const fx = asClockFixture(f)
  const periods = fx.periods
  if (!Array.isArray(periods)) return false
  return periods.some((p) => Boolean(p?.ticking))
}

/** 2e période en cours (pour afficher 46' vs 45+1). */
export function liveSecondHalfFromSmFixture(f: SmFixture): boolean {
  const fx = asClockFixture(f)
  if (liveClockPausedFromSmFixture(fx)) {
    const sid = stateIdOf(fx)
    return sid != null && SECOND_HALF_STATE_IDS.has(sid)
  }

  const periods = fx.periods
  if (Array.isArray(periods) && periods.length) {
    const ticking = periods.find((p) => p?.ticking)
    const ref = ticking ?? periods[periods.length - 1]
    if (ref) {
      const countsFrom = typeof ref.counts_from === 'number' ? ref.counts_from : 0
      if (countsFrom >= 45) return true
      if (countsFrom === 0) {
        const sidEarly = stateIdOf(fx)
        if (sidEarly != null && SECOND_HALF_STATE_IDS.has(sidEarly)) return true
        return false
      }
    }
  }

  const sid = stateIdOf(fx)
  if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) return true
  if (sid === 3) return false

  const fromPeriods = minuteFromPeriods(fx)
  const total = fromPeriods ?? (typeof fx.minute === 'number' ? fx.minute : 0)
  return total > 50
}

/** Mi-temps / pause : calé sur SportMonks (périodes + état), sans extrapolation client. */
export function liveClockPausedFromSmFixture(f: SmFixture): boolean {
  const fx = asClockFixture(f)
  const sid = stateIdOf(fx)
  const blob = `${fx.state?.developer_name ?? ''} ${fx.state?.state ?? ''}`.toUpperCase()

  if (Array.isArray(fx.periods) && fx.periods.some((p) => p?.ticking)) return false

  if (sid === 3) return true

  if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) {
    const apiMin = typeof fx.minute === 'number' ? fx.minute : minuteFromPeriods(fx)
    if (apiMin != null && apiMin >= 46) return false
  }

  if (
    /\bHT\b/.test(blob) ||
    blob.includes('HALF TIME') ||
    blob.includes('HALFTIME') ||
    blob.includes('BREAK')
  ) {
    if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) return false
    return true
  }

  /** Fin 1re période, horloge arrêtée → mi-temps (même si le libellé HT tarde). */
  if (Array.isArray(fx.periods) && fx.periods.length > 0) {
    if (fx.periods.some((p) => Boolean(p?.ticking) && typeof p.counts_from === 'number' && p.counts_from >= 45)) {
      return false
    }
    if (sid != null && SECOND_HALF_STATE_IDS.has(sid)) return false

    const maxTotal = fx.periods.reduce((acc, p) => {
      const t = periodMinuteTotal(p)
      return t != null ? Math.max(acc, t) : acc
    }, 0)
    if (maxTotal >= 45 && (sid == null || sid === 2 || sid === 3)) return true
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

function scoreRowDescription(s: SmScoreRow): string {
  return String(s.description ?? s.type?.developer_name ?? '').toUpperCase()
}

function isPartialPeriodScoreRow(s: SmScoreRow): boolean {
  const d = scoreRowDescription(s)
  return d === '1ST_HALF' || d === '2ND_HALF_ONLY'
}

function isPenaltyShootoutScoreRow(s: SmScoreRow): boolean {
  const d = scoreRowDescription(s)
  return d === 'PENALTIES' || d.includes('PENALTY_SHOOTOUT')
}

function aggregateScoreRows(rows: SmScoreRow[]): { home: number; away: number } | undefined {
  if (!rows.length) return undefined
  let home = 0
  let away = 0
  let sawHome = false
  let sawAway = false
  for (const s of rows) {
    const g = s.score?.goals
    const part = String(s.score?.participant ?? '').toLowerCase()
    const gn = g == null ? NaN : Number(g)
    if (!Number.isFinite(gn)) continue
    if (part === 'home') {
      home = Math.max(home, gn)
      sawHome = true
    }
    if (part === 'away') {
      away = Math.max(away, gn)
      sawAway = true
    }
  }
  if (!sawHome && !sawAway) return undefined
  return { home, away }
}

function goalsFromScoreDescription(
  scores: SmScoreRow[] | undefined,
  description: string,
): { home: number; away: number } | undefined {
  if (!scores?.length) return undefined
  const want = description.toUpperCase()
  return aggregateScoreRows(scores.filter((s) => scoreRowDescription(s) === want))
}

/** Score temps réglementaire + prolongations (`CURRENT` SM) — exclut les tirs au but. */
function goalsFromScores(scores: SmScoreRow[] | undefined): { home: number; away: number } | undefined {
  const regulation = extractRegulationGoalsFromScores(scores)
  if (regulation) return regulation

  const current = goalsFromScoreDescription(scores, 'CURRENT')
  if (current) return current

  if (!scores?.length) return undefined

  for (const desc of ['2ND_HALF', 'EXTRA_TIME']) {
    const row = goalsFromScoreDescription(scores, desc)
    if (row) return row
  }

  const pool = scores.filter((s) => !isPartialPeriodScoreRow(s) && !isPenaltyShootoutScoreRow(s))
  const agg = aggregateScoreRows(pool)
  if (agg) return agg

  const sawSide = scores.some((s) => {
    if (isPenaltyShootoutScoreRow(s)) return false
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

/** Tirs au but réussis (`PENALTIES` SM) — à afficher sous le score du temps de jeu. */
export function extractPenaltyShootoutScoreFromSmFixture(
  f: SmFixture,
): { home: number; away: number } | undefined {
  return goalsFromScoreDescription(f.scores, 'PENALTIES')
}

function minuteFromFixture(f: SmFixture, nowMs = Date.now()): number {
  const fx = asClockFixture(f)
  const fromPeriods = minuteFromPeriods(fx, nowMs)
  const fromEvents = minuteFromEvents(fx)
  const fromComments = minuteFromComments(fx)
  const fxMinute = typeof fx.minute === 'number' ? fx.minute : null
  const inSecondHalf = liveSecondHalfFromSmFixture(fx)
  const paused = liveClockPausedFromSmFixture(fx)

  if (inSecondHalf && !paused) {
    const periods = Array.isArray(fx.periods) ? fx.periods : []
    const ticking2H = periods.find((p) => p?.ticking && periodCountsFrom(p) >= 45)
    if (ticking2H) {
      const periodMin = periodMinuteValue(ticking2H, nowMs)
      if (periodMin != null) return Math.min(99, periodMin)
    }

    const feedMax = Math.max(
      fromEvents ?? 0,
      fromComments ?? 0,
      fxMinute ?? 0,
      fromPeriods ?? 0,
    )
    // Événements 2e MT fiables une fois le match relancé (≥52').
    if (fromEvents != null && fromEvents >= 52) {
      return Math.min(99, feedMax)
    }

    // Reprise 2e MT : SM annonce INPLAY_2ND_HALF mais cumule encore 47'–51' (1re MT).
    const sid = stateIdOf(fx)
    if (sid != null && SECOND_HALF_STATE_IDS.has(sid) && feedMax >= 47 && feedMax <= 51) {
      return 46
    }
  }

  const candidates = [
    fromPeriods,
    fromEvents,
    fromComments,
    fxMinute != null && fxMinute > 0 ? fxMinute : null,
  ].filter((v): v is number => v != null && Number.isFinite(v))

  if (candidates.length) return Math.min(99, Math.max(...candidates))
  if (fxMinute != null && fxMinute >= 0) return fxMinute
  return 0
}

/** Minute affichée (période / `fixture.minute`) pour caler l’encart sur le live SM. */
export function extractLiveMinuteFromSmFixture(f: SmFixture): number {
  return minuteFromFixture(f)
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
  const fx = asClockFixture(f)
  const lg = leagueForInfer(fx)
  const compId = inferCompIdFromLeague(lg)
  const comp = COMP_NAMES[compId] ?? {
    name: lg?.name ?? f.league?.name ?? 'Compétition',
    shortName: (lg?.short_code ?? f.league?.short_code ?? f.league?.name ?? '?')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5)
      .toUpperCase() || '?',
  }
  const { home: hn, away: an, homeSmId, awaySmId, homeLogoUrl, awayLogoUrl } = namesFromParticipants(fx)
  const home = getTeam(compId, hn, homeSmId, homeLogoUrl)
  const away = getTeam(compId, an, awaySmId, awayLogoUrl)
  const statusFromProvider = smStatus(fx)
  const id = `m-sm-${fx.id}`
  const kickoffAt = startingAtIso(fx)
  const kickoffMs = Date.parse(kickoffAt)
  const nowMs = Date.now()
  const hasFutureKickoff = Number.isFinite(kickoffMs) && kickoffMs > nowMs + 60_000
  // Garde-fou: certaines fixtures SM peuvent exposer un état "finished" alors que
  // la date de coup d'envoi est encore future; on évite d'afficher un faux "Terminé".
  const status = hasFutureKickoff && statusFromProvider === 'finished' ? 'upcoming' : statusFromProvider
  const score = goalsFromScores(fx.scores)
  const penaltyScore = extractPenaltyShootoutScoreFromSmFixture(fx)

  const roundId =
    typeof fx.round?.id === 'number'
      ? fx.round.id
      : typeof fx.round_id === 'number'
        ? fx.round_id
        : undefined
  const roundName = fx.round?.name?.trim() || undefined
  const stageName = fx.stage?.name?.trim() || undefined
  const venueName = fx.venue?.name?.trim() || undefined

  const base: Match = {
    id,
    competition: { id: compId, name: comp.name, shortName: comp.shortName },
    home,
    away,
    kickoffAt,
    status,
    provider: 'sportmonks',
    sportMonksFixtureId: fx.id,
    ...(roundId != null ? { sportMonksRoundId: roundId } : {}),
    ...(roundName ? { roundName } : {}),
    ...(stageName ? { stageName } : {}),
    ...(venueName ? { venueName } : {}),
  }

  if (status === 'live') {
    return localizeMatchTeams({
      ...base,
      minute: minuteFromFixture(fx),
      score: score ?? { home: 0, away: 0 },
      ...(penaltyScore ? { penaltyScore } : {}),
      liveClockPaused: liveClockPausedFromSmFixture(fx),
      liveInSecondHalf: liveSecondHalfFromSmFixture(fx),
      livePeriodTicking: livePeriodTickingFromSmFixture(fx),
    })
  }
  if (status === 'finished' && score) {
    return localizeMatchTeams({
      ...base,
      score,
      ...(penaltyScore ? { penaltyScore } : {}),
    })
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
