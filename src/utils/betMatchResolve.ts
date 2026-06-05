import {
  fetchSportMonksFixtureEventsTimeline,
  fetchSportMonksFixtureEventsWeather,
  smFixtureToMatch,
} from '../api/sportMonks'
import type { Bet, BetMatchLabel } from '../types/bet'
import type { Match } from '../types/match'
import { getSportMonksToken } from './apiTokens'

const BET_MATCH_CACHE_KEY = 'talkfoot.bet-match-cache.v1'

type BetMatchCache = Record<string, Match>

export function readBetMatchCache(): BetMatchCache {
  try {
    const raw = localStorage.getItem(BET_MATCH_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as BetMatchCache
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writeBetMatchCacheEntry(match: Match, aliasId?: string): void {
  try {
    const prev = readBetMatchCache()
    prev[match.id] = match
    if (aliasId && aliasId !== match.id) prev[aliasId] = match
    localStorage.setItem(BET_MATCH_CACHE_KEY, JSON.stringify(prev))
  } catch {
    /* quota / mode privé */
  }
}

function readCachedMatchForBetId(matchId: string): Match | null {
  const cache = readBetMatchCache()
  if (cache[matchId]) return cache[matchId]!
  const fixtureId = parseSportMonksFixtureIdFromMatchId(matchId)
  if (!fixtureId) return null
  for (const m of Object.values(cache)) {
    if (parseSportMonksFixtureIdFromMatchId(m.id) === fixtureId) return m
  }
  return null
}

export function betMatchLabelFromMatch(match: Match): BetMatchLabel {
  return {
    homeShort: match.home.shortName,
    awayShort: match.away.shortName,
    homeName: match.home.name,
    awayName: match.away.name,
    competition: match.competition.shortName,
    kickoffAt: match.kickoffAt,
    status: match.status,
    scoreHome: match.score?.home,
    scoreAway: match.score?.away,
  }
}

export function parseSportMonksFixtureIdFromMatchId(matchId: string): number | null {
  const id = matchId.trim()
  const strict = /^m-sm-(\d+)$/.exec(id)
  if (strict) {
    const n = Number(strict[1])
    return Number.isFinite(n) ? n : null
  }
  const loose = /(\d{5,})$/.exec(id)
  if (loose) {
    const n = Number(loose[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function syntheticMatchFromBetLabel(bet: Bet): Match | null {
  const l = bet.matchLabel
  if (!l) return null
  const hasScore = l.scoreHome != null && l.scoreAway != null
  return {
    id: bet.matchId,
    competition: {
      id: 'bet-label',
      name: l.competition ?? 'Match',
      shortName: l.competition ?? 'Match',
    },
    home: {
      id: `${bet.matchId}-home`,
      name: l.homeName?.trim() || l.homeShort,
      shortName: l.homeShort,
      colors: { primary: '#1e3a5f', secondary: '#0d2135' },
    },
    away: {
      id: `${bet.matchId}-away`,
      name: l.awayName?.trim() || l.awayShort,
      shortName: l.awayShort,
      colors: { primary: '#1e3a5f', secondary: '#0d2135' },
    },
    kickoffAt: l.kickoffAt ?? bet.placedAt,
    status: l.status ?? (hasScore ? 'finished' : 'upcoming'),
    score: hasScore ? { home: l.scoreHome!, away: l.scoreAway! } : undefined,
    provider: 'sportmonks',
  }
}

export function resolveBetMatch(bet: Bet, live: Match | null | undefined): Match | null {
  if (live) return live
  return syntheticMatchFromBetLabel(bet)
}

export async function fetchMatchByTalkFootId(matchId: string): Promise<Match | null> {
  const cached = readCachedMatchForBetId(matchId)
  if (cached) return cached

  const fixtureId = parseSportMonksFixtureIdFromMatchId(matchId)
  const token = getSportMonksToken()
  if (!fixtureId || !token) return null

  const fetchers = [fetchSportMonksFixtureEventsWeather, fetchSportMonksFixtureEventsTimeline]
  for (const fetcher of fetchers) {
    try {
      const fx = await fetcher(token, fixtureId)
      if (!fx) continue
      const match = smFixtureToMatch(fx)
      writeBetMatchCacheEntry(match, matchId)
      return match
    } catch {
      /* essai suivant */
    }
  }
  return null
}

export function enrichBetWithMatchLabel(bet: Bet, match: Match): Bet {
  if (bet.matchLabel) return bet
  return { ...bet, matchLabel: betMatchLabelFromMatch(match) }
}
