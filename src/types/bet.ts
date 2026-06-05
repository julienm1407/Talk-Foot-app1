export type BetMarket =
  | 'next_goal'
  | 'first_goal'
  | 'exact_score'
  | 'result_1x2'
  | 'over25'
  | 'anytime_scorer'

export type BetStatus = 'open' | 'won' | 'lost' | 'cancelled'

export type BetSelection =
  | 'home'
  | 'draw'
  | 'away'
  | 'over'
  | 'under'
  | '00'
  | '10'
  | '20'
  | '21'
  | '11'
  | '01'
  | '12'
  | `scor:${'home' | 'away'}:${string}`

/** Infos match figées au moment du pari (affichage pronostic si le match sort du calendrier). */
export type BetMatchLabel = {
  homeShort: string
  awayShort: string
  homeName?: string
  awayName?: string
  competition?: string
  kickoffAt?: string
  status?: 'upcoming' | 'live' | 'finished'
  scoreHome?: number
  scoreAway?: number
}

export type Bet = {
  id: string
  matchId: string
  market: BetMarket
  selection: BetSelection
  stake: number
  odds: number
  status: BetStatus
  placedAt: string
  settledAt?: string
  payout?: number
  matchLabel?: BetMatchLabel
}

export type Wallet = {
  /** Jetons de pari — uniquement gagnés en jeu (paris, bonus), jamais achetés en € */
  tokens: number
  /** Médailles premium — achetées en €, dépensées en boutique (cosmétiques) */
  medals: number
  /** Date ISO jour (YYYY-MM-DD) du dernier bonus jetons quotidien réclamé */
  lastDailyTokenGrant?: string
}

