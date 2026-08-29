import type { FormResult } from '../types/standings'
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../api/sportMonks/extract1x2OddsFromSm'

export type { SmBookOdds1x2, SmBookOddsOverUnder25 }

/** Entrées normalisées 0–100 pour le score de puissance. */
export type TeamPowerFactors = {
  form: number
  attack: number
  defense: number
  home: number
  ranking: number
}

export type TeamOddsContext = {
  teamId: string
  factors: TeamPowerFactors
  /** 0–1 : réduction si absences clés (blessures / suspensions). */
  absenceFactor?: number
}

export type MatchOddsContext = {
  home: TeamOddsContext
  away: TeamOddsContext
  leagueSize: number
  /** Plafond d’écart de puissance prematch (clubs ~14, sélections ~22). */
  maxPowerDiff?: number
}

export type Probabilities1x2 = { pHome: number; pDraw: number; pAway: number }

export type ScorerOddsContext = {
  name: string
  side: 'home' | 'away'
  isStarter: boolean
  formationPosition?: number
  isPenaltyTaker?: boolean
  /** Buts sur les 5 derniers matchs (équipe ou joueur estimé). */
  recentGoalsLast5?: number
  /** Moyenne buts / match (saison ou estimée). */
  goalsPerMatch?: number
}

export type LiveOddsContext = {
  minute: number
  homeGoals: number
  awayGoals: number
  homeRedCards?: number
  awayRedCards?: number
  homeShotsOnTarget?: number
  awayShotsOnTarget?: number
}

export type LiveOverUnderLines = {
  /** Masquer la ligne +0,5 buts restants (ex. 1-0 à la 70e). */
  hidePlus05: boolean
  /** Probabilité implicite « au moins 2 buts au total » (ligne +1,5 buts match). */
  pOver15: number
  /** Probabilité « au moins 3 buts au total » (ligne +2,5). */
  pOver25: number
}

export type InternalOddsResult = {
  odds1x2: SmBookOdds1x2
  oddsOverUnder25: SmBookOddsOverUnder25
  probs1x2: Probabilities1x2
  source: 'talkfoot' | 'fallback'
  marginPct: number
}

/** Données brutes pour construire le contexte (standings SM). */
export type StandingSlice = {
  teamId: string
  rank: number
  played: number
  gf: number
  ga: number
  form: FormResult[]
  attackIndex: number
  defenseIndex: number
  momentumIndex: number
}
