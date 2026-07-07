import type { WcMatch } from '../types/wc2026'

export type WcMatchOutcome = {
  winner: 'home' | 'away' | null
  decidedOnPenalties: boolean
  penaltyShootout?: { home: number; away: number }
}

/** Vainqueur affichage arbre / cartes — temps réglementaire ou tirs au but. */
export function resolveWcMatchOutcome(match: WcMatch): WcMatchOutcome {
  if (match.status !== 'finished') {
    return { winner: null, decidedOnPenalties: false }
  }

  const homeGoals = match.home.goals
  const awayGoals = match.away.goals
  if (homeGoals == null || awayGoals == null) {
    return { winner: null, decidedOnPenalties: false }
  }

  if (homeGoals > awayGoals) {
    return { winner: 'home', decidedOnPenalties: false }
  }
  if (awayGoals > homeGoals) {
    return { winner: 'away', decidedOnPenalties: false }
  }

  const homePen = match.home.penaltyGoals
  const awayPen = match.away.penaltyGoals
  if (homePen != null && awayPen != null && (homePen > 0 || awayPen > 0)) {
    const penaltyShootout = { home: homePen, away: awayPen }
    if (homePen > awayPen) {
      return { winner: 'home', decidedOnPenalties: true, penaltyShootout }
    }
    if (awayPen > homePen) {
      return { winner: 'away', decidedOnPenalties: true, penaltyShootout }
    }
  }

  return { winner: null, decidedOnPenalties: false }
}
