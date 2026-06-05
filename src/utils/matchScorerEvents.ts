import {
  extractTimelineHighlightsFromSmFixture,
  fetchSportMonksFixtureEventsWeather,
} from '../api/sportMonks'
import type { Match } from '../types/match'
import { extractScorerEventsFromHighlights } from './liveFootballOdds'
import { getSportMonksToken } from './apiTokens'

export type MatchScorerEvent = { side: 'home' | 'away'; slug: string; name?: string }

/** Buteurs du match (timeline SportMonks) pour règlement paris buteur. */
export async function loadScorerEventsForMatch(match: Match): Promise<MatchScorerEvent[]> {
  const token = getSportMonksToken()
  if (!match.sportMonksFixtureId || !token) return []

  try {
    const fx = await fetchSportMonksFixtureEventsWeather(token, match.sportMonksFixtureId)
    if (!fx) return []
    const highlights = extractTimelineHighlightsFromSmFixture(fx, match.id)
    return extractScorerEventsFromHighlights(
      highlights,
      { shortName: match.home.shortName, name: match.home.name },
      { shortName: match.away.shortName, name: match.away.name },
    ).map((e) => ({ side: e.side, slug: e.slug, name: e.name }))
  } catch {
    return []
  }
}
