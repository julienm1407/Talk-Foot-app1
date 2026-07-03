import { extractCurrentGoalsFromSmFixture } from '../api/sportMonks'
import type { SmFixture } from '../api/sportMonks/types'
import type { Highlight } from '../data/highlights'
import { extractRegulationGoalsFromScores } from './matchRegulationScore'

/**
 * Score utilisé pour les cotes live : le max entre le score officiel,
 * le score fixture SM (hors tirs au but) et les buts structurés déjà présents en timeline.
 */
export function resolveLiveScoreForBetting(opts: {
  officialHome: number
  officialAway: number
  fixture: SmFixture | null | undefined
  highlights: Highlight[]
  matchStatus?: 'upcoming' | 'live' | 'finished'
}): { home: number; away: number } {
  if (opts.matchStatus === 'finished') {
    return {
      home: Math.max(0, opts.officialHome),
      away: Math.max(0, opts.officialAway),
    }
  }

  let home = Math.max(0, opts.officialHome)
  let away = Math.max(0, opts.officialAway)

  const fromFx = opts.fixture
    ? extractRegulationGoalsFromScores(opts.fixture.scores) ??
      extractCurrentGoalsFromSmFixture(opts.fixture)
    : null
  if (fromFx) {
    home = Math.max(home, fromFx.home)
    away = Math.max(away, fromFx.away)
  }

  let fromEventsHome = 0
  let fromEventsAway = 0
  for (const h of opts.highlights) {
    if (h.type !== 'But' || !h.id.startsWith('sm-event-')) continue
    if (typeof h.minute === 'number' && h.minute > 120) continue
    if (h.side === 'home') fromEventsHome += 1
    else if (h.side === 'away') fromEventsAway += 1
  }
  home = Math.max(home, fromEventsHome)
  away = Math.max(away, fromEventsAway)

  return { home, away }
}
