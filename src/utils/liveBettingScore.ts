import { extractCurrentGoalsFromSmFixture } from '../api/sportMonks'
import type { SmFixture } from '../api/sportMonks/types'
import type { Highlight } from '../data/highlights'

/**
 * Score utilisé pour les cotes live : le max entre le score officiel,
 * le score fixture SM et les buts structurés déjà présents en timeline.
 * Permet d’ajuster les cotes dès l’événement but, avant la sync du score affiché.
 */
export function resolveLiveScoreForBetting(opts: {
  officialHome: number
  officialAway: number
  fixture: SmFixture | null | undefined
  highlights: Highlight[]
}): { home: number; away: number } {
  let home = Math.max(0, opts.officialHome)
  let away = Math.max(0, opts.officialAway)

  const fromFx = opts.fixture ? extractCurrentGoalsFromSmFixture(opts.fixture) : null
  if (fromFx) {
    home = Math.max(home, fromFx.home)
    away = Math.max(away, fromFx.away)
  }

  let fromEventsHome = 0
  let fromEventsAway = 0
  for (const h of opts.highlights) {
    if (h.type !== 'But' || !h.id.startsWith('sm-event-')) continue
    if (h.side === 'home') fromEventsHome += 1
    else if (h.side === 'away') fromEventsAway += 1
  }
  home = Math.max(home, fromEventsHome)
  away = Math.max(away, fromEventsAway)

  return { home, away }
}
