import type { Match } from '../types/match'
import { teams } from '../data/teams'
import {
  EUROPE_COMPETITION_IDS,
  EUROPE_MULTIPLEX_TITLES,
  type EuropeCompetitionId,
} from '../data/talkFootEditorial'
import { readTalkFootEditorial, type TalkFootEditorialResolved } from './talkFootEditorialStore'
import { addParisCalendarDays, matchCalendarDayKeyParis } from './time'

const LIGUE1_IDS = new Set((teams['ligue-1'] ?? []).map((t) => t.id))
const EUROPE_SET = new Set<string>(EUROPE_COMPETITION_IDS)

function kickoffMs(iso: string): number {
  const n = Date.parse(iso)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function hasClub(match: Match, clubId: string): boolean {
  return match.home.id === clubId || match.away.id === clubId
}

function isLigue1Club(id: string): boolean {
  return LIGUE1_IDS.has(id)
}

function isEuropeComp(id: string): id is EuropeCompetitionId {
  return EUROPE_SET.has(id)
}

function isPsgMatch(match: Match): boolean {
  return hasClub(match, 'psg')
}

function isLigue1InEurope(match: Match): boolean {
  if (!isEuropeComp(match.competition.id)) return false
  return isLigue1Club(match.home.id) || isLigue1Club(match.away.id)
}

function isLigue1Choc(match: Match, editorial: TalkFootEditorialResolved): boolean {
  if (match.competition.id !== 'ligue-1') return false
  const a = match.home.id
  const b = match.away.id
  const top = new Set(editorial.top5Ids)
  if (top.has(a) && top.has(b)) return true
  const key = pairKey(a, b)
  return editorial.chocPairs.some(([x, y]) => pairKey(x, y) === key)
}

function isLigue1Domestic(match: Match): boolean {
  return match.competition.id === 'ligue-1'
}

function isLigue1InUclUel(match: Match): boolean {
  if (match.competition.id !== 'ucl' && match.competition.id !== 'uel') return false
  return isLigue1Club(match.home.id) || isLigue1Club(match.away.id)
}

function isBigEuropeanClash(match: Match): boolean {
  return match.competition.id === 'ucl' || match.competition.id === 'uel'
}

function isPriority2(match: Match, editorial: TalkFootEditorialResolved): boolean {
  return isLigue1Domestic(match) || isLigue1Choc(match, editorial) || isLigue1InUclUel(match)
}

function onParisDay(match: Match, dayKey: string): boolean {
  return matchCalendarDayKeyParis(match.kickoffAt) === dayKey
}

function rankLiveFirst(a: Match, b: Match): number {
  const live = Number(b.status === 'live') - Number(a.status === 'live')
  if (live !== 0) return live
  return kickoffMs(a.kickoffAt) - kickoffMs(b.kickoffAt)
}

export type TalkFootMultiplex = {
  id: string
  competitionId: EuropeCompetitionId
  title: string
  dayKey: string
  matches: Match[]
}

export type TalkFootHomeBoard = {
  featured: Match | null
  /** PSG (ou à défaut prio 2) dans les 7 prochains jours — salon ouvert même hors jour J. */
  weekMatch: Match | null
  alsoTonight: Match[]
  multiplex: TalkFootMultiplex | null
}

export function talkFootMultiplexId(competitionId: EuropeCompetitionId, dayKey: string): string {
  return `m-mux-${competitionId}-${dayKey}`
}

export function parseTalkFootMultiplexId(
  matchId: string,
): { competitionId: EuropeCompetitionId; dayKey: string } | null {
  const m = /^m-mux-(ucl|uel|uecl)-(\d{4}-\d{2}-\d{2})$/.exec(matchId)
  if (!m) return null
  return { competitionId: m[1] as EuropeCompetitionId, dayKey: m[2] }
}

export function isTalkFootMultiplexId(matchId: string | undefined): boolean {
  return Boolean(matchId && parseTalkFootMultiplexId(matchId))
}

export function buildEuropeMultiplex(
  dayMatches: Match[],
  dayKey: string,
  competitionId: EuropeCompetitionId,
): TalkFootMultiplex | null {
  const matches = dayMatches
    .filter((m) => m.competition.id === competitionId)
    .sort(rankLiveFirst)
  if (!matches.length) return null
  return {
    id: talkFootMultiplexId(competitionId, dayKey),
    competitionId,
    title: EUROPE_MULTIPLEX_TITLES[competitionId],
    dayKey,
    matches,
  }
}

function pickEuropeMultiplex(dayMatches: Match[], dayKey: string): TalkFootMultiplex | null {
  return (
    buildEuropeMultiplex(dayMatches, dayKey, 'ucl') ??
    buildEuropeMultiplex(dayMatches, dayKey, 'uel') ??
    buildEuropeMultiplex(dayMatches, dayKey, 'uecl')
  )
}

export function resolveTalkFootMultiplex(matches: Match[], muxId: string): TalkFootMultiplex | null {
  const parsed = parseTalkFootMultiplexId(muxId)
  if (!parsed) return null
  const dayMatches = matches.filter((m) => onParisDay(m, parsed.dayKey))
  return buildEuropeMultiplex(dayMatches, parsed.dayKey, parsed.competitionId)
}

/** Salon multiplex même si le calendrier n’a pas encore chargé les matchs. */
export function emptyTalkFootMultiplex(muxId: string): TalkFootMultiplex | null {
  const parsed = parseTalkFootMultiplexId(muxId)
  if (!parsed) return null
  return {
    id: muxId,
    competitionId: parsed.competitionId,
    title: EUROPE_MULTIPLEX_TITLES[parsed.competitionId],
    dayKey: parsed.dayKey,
    matches: [],
  }
}

function multiplexSalonStatus(mux: TalkFootMultiplex, now: Date): Match['status'] {
  if (mux.matches.some((m) => m.status === 'live')) return 'live'
  if (mux.matches.some((m) => m.status === 'upcoming')) return 'upcoming'
  const today = matchCalendarDayKeyParis(now)
  if (mux.dayKey > today) return 'upcoming'
  if (mux.dayKey === today) {
    if (mux.matches.length === 0) return 'upcoming'
    if (mux.matches.every((m) => m.status === 'finished')) return 'finished'
    return 'upcoming'
  }
  return 'finished'
}

export function multiplexSyntheticMatch(mux: TalkFootMultiplex, now: Date = new Date()): Match {
  const status = multiplexSalonStatus(mux, now)
  const kickoffAt = mux.matches[0]?.kickoffAt ?? `${mux.dayKey}T20:00:00+01:00`
  return {
    id: mux.id,
    competition: {
      id: mux.competitionId,
      name: mux.title,
      shortName: mux.competitionId === 'ucl' ? 'LDC' : mux.competitionId === 'uel' ? 'EL' : 'UECL',
    },
    home: {
      id: 'mux-home',
      name: mux.title,
      shortName: mux.competitionId === 'ucl' ? 'C1' : mux.competitionId === 'uel' ? 'C3' : 'C4',
      colors: { primary: '#1d4ed8', secondary: '#fbbf24' },
    },
    away: {
      id: 'mux-away',
      name: 'Tribune commune',
      shortName: 'Salon',
      colors: { primary: '#0f172a', secondary: '#e2e8f0' },
    },
    kickoffAt,
    status,
  }
}

export function pickTalkFootHomeBoard(
  matches: Match[],
  now: Date = new Date(),
  editorial: TalkFootEditorialResolved = readTalkFootEditorial(),
): TalkFootHomeBoard {
  const today = matchCalendarDayKeyParis(now)
  const weekEnd = addParisCalendarDays(today, 6)
  const dayMatches = matches.filter((m) => onParisDay(m, today))
  const multiplex = pickEuropeMultiplex(dayMatches, today)

  const forcedId = editorial.forceByDay[today]
  const forced = forcedId ? matches.find((m) => m.id === forcedId) ?? null : null

  const psgToday = dayMatches.filter(isPsgMatch).sort(rankLiveFirst)
  const ligue1Today = dayMatches.filter(isLigue1Domestic).sort(rankLiveFirst)
  const l1EuropeToday = dayMatches.filter(isLigue1InUclUel).sort(rankLiveFirst)
  const bigEuToday = dayMatches.filter(isBigEuropeanClash).sort(rankLiveFirst)
  const l1UeclToday = dayMatches.filter(isLigue1InEurope).sort(rankLiveFirst)
  const prio2Today = dayMatches.filter((m) => isPriority2(m, editorial)).sort(rankLiveFirst)

  const weekPool = matches
    .filter((m) => {
      if (m.status === 'finished') return false
      const k = matchCalendarDayKeyParis(m.kickoffAt)
      return k >= today && k <= weekEnd
    })
    .sort((a, b) => kickoffMs(a.kickoffAt) - kickoffMs(b.kickoffAt))
  const weekMatch =
    weekPool.find(isPsgMatch) ??
    weekPool.find(isLigue1Domestic) ??
    weekPool.find(isLigue1InUclUel) ??
    weekPool.find(isBigEuropeanClash) ??
    weekPool.find((m) => isPriority2(m, editorial)) ??
    null

  let featured: Match | null = forced
  if (!featured) featured = psgToday[0] ?? null
  if (!featured) featured = ligue1Today[0] ?? null
  if (!featured) featured = l1EuropeToday[0] ?? null
  if (!featured) featured = bigEuToday[0] ?? null
  if (!featured) featured = l1UeclToday[0] ?? null
  if (!featured) featured = prio2Today[0] ?? null
  if (!featured) featured = weekMatch

  const alsoTonight = [...ligue1Today, ...l1EuropeToday, ...bigEuToday]
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i && m.id !== featured?.id)
    .slice(0, 2)

  return { featured, weekMatch, alsoTonight, multiplex }
}

/** Un seul match épinglé (compat accueil / salon). */
export function pickTalkFootMatchOfTheDay(
  matches: Match[],
  _favoriteClubIds: string[] = [],
  now: Date = new Date(),
): Match | null {
  return pickTalkFootHomeBoard(matches, now).featured
}

const FEATURED_MATCH_STORAGE_KEY = 'talkfoot.featuredMatchId.v1'
const FEATURED_MATCH_IDS_KEY = 'talkfoot.featuredMatchIds.v1'

export function rememberTalkFootFeaturedIds(ids: Array<string | null | undefined>): void {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  try {
    if (unique.length) {
      sessionStorage.setItem(FEATURED_MATCH_IDS_KEY, JSON.stringify(unique))
      sessionStorage.setItem(FEATURED_MATCH_STORAGE_KEY, unique[0]!)
    } else {
      sessionStorage.removeItem(FEATURED_MATCH_IDS_KEY)
      sessionStorage.removeItem(FEATURED_MATCH_STORAGE_KEY)
    }
  } catch {
    /* private mode */
  }
}

export function rememberFeaturedTalkFootMatchId(id: string | null): void {
  rememberTalkFootFeaturedIds(id ? [id] : [])
}

export function readRememberedFeaturedTalkFootMatchId(): string | null {
  try {
    const raw = sessionStorage.getItem(FEATURED_MATCH_IDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
    }
    return sessionStorage.getItem(FEATURED_MATCH_STORAGE_KEY)
  } catch {
    return null
  }
}

function rememberedFeaturedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(FEATURED_MATCH_IDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string')
    }
    const one = sessionStorage.getItem(FEATURED_MATCH_STORAGE_KEY)
    return one ? [one] : []
  } catch {
    return []
  }
}

/** Live, ou coup d’envoi aujourd’hui (calendrier Paris). */
export function isTalkFootMatchToday(match: Pick<Match, 'kickoffAt' | 'status'>, now: Date = new Date()): boolean {
  if (match.status === 'live') return true
  return matchCalendarDayKeyParis(match.kickoffAt) === matchCalendarDayKeyParis(now)
}

export function isTalkFootFeaturedMatch(
  matchId: string,
  matches: Match[],
  _favoriteClubIds: string[] = [],
  now: Date = new Date(),
): boolean {
  const board = pickTalkFootHomeBoard(matches, now)
  if (board.featured?.id === matchId) return true
  if (board.weekMatch?.id === matchId) return true
  if (board.multiplex?.id === matchId) return true
  return rememberedFeaturedIds().includes(matchId)
}
