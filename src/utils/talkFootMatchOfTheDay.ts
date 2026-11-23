import type { Match } from '../types/match'
import { teams } from '../data/teams'
import {
  EUROPE_COMPETITION_IDS,
  EUROPE_MULTIPLEX_TITLES,
  type EuropeCompetitionId,
} from '../data/talkFootEditorial'
import { readTalkFootEditorial, type TalkFootEditorialResolved } from './talkFootEditorialStore'
import { matchCalendarDayKeyParis } from './time'

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

function isPriority2(match: Match, editorial: TalkFootEditorialResolved): boolean {
  return isLigue1InEurope(match) || isLigue1Choc(match, editorial)
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
    .filter(
      (m) =>
        m.competition.id === competitionId && !isLigue1Club(m.home.id) && !isLigue1Club(m.away.id),
    )
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

export function multiplexSyntheticMatch(mux: TalkFootMultiplex): Match {
  const live = mux.matches.some((m) => m.status === 'live')
  const upcoming = mux.matches.some((m) => m.status === 'upcoming')
  const status: Match['status'] = live ? 'live' : upcoming ? 'upcoming' : 'finished'
  const kickoffAt = mux.matches[0]?.kickoffAt ?? `${mux.dayKey}T20:00:00+01:00`
  const label = mux.title.replace('Multiplex ', '')
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
      shortName: mux.competitionId === 'ucl' ? 'LDC' : 'EUR',
      colors: { primary: '#1d4ed8', secondary: '#fbbf24' },
    },
    away: {
      id: 'mux-away',
      name: label,
      shortName: 'Soirée',
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
  const dayMatches = matches.filter((m) => onParisDay(m, today))
  const multiplex = pickEuropeMultiplex(dayMatches, today)

  const forcedId = editorial.forceByDay[today]
  const forced = forcedId ? matches.find((m) => m.id === forcedId) ?? null : null

  const psgToday = dayMatches.filter(isPsgMatch).sort(rankLiveFirst)
  const prio2Today = dayMatches.filter((m) => isPriority2(m, editorial)).sort(rankLiveFirst)

  let featured: Match | null = forced
  if (!featured) featured = psgToday[0] ?? null
  if (!featured) featured = prio2Today[0] ?? null

  if (!featured) {
    const future = matches
      .filter((m) => m.status !== 'finished' && matchCalendarDayKeyParis(m.kickoffAt) > today)
      .filter((m) => isPsgMatch(m) || isPriority2(m, editorial))
      .sort((a, b) => kickoffMs(a.kickoffAt) - kickoffMs(b.kickoffAt))
    featured = future[0] ?? null
  }

  const alsoTonight = prio2Today.filter((m) => m.id !== featured?.id).slice(0, 2)

  return { featured, alsoTonight, multiplex }
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

export function rememberFeaturedTalkFootMatchId(id: string | null): void {
  try {
    if (id) sessionStorage.setItem(FEATURED_MATCH_STORAGE_KEY, id)
    else sessionStorage.removeItem(FEATURED_MATCH_STORAGE_KEY)
  } catch {
    /* private mode */
  }
}

export function readRememberedFeaturedTalkFootMatchId(): string | null {
  try {
    return sessionStorage.getItem(FEATURED_MATCH_STORAGE_KEY)
  } catch {
    return null
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
  if (board.multiplex?.id === matchId) return true
  return readRememberedFeaturedTalkFootMatchId() === matchId
}
