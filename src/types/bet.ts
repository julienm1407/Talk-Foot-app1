export type BetMarket =
  | 'next_goal'
  | 'first_goal'
  | 'exact_score'
  | 'result_1x2'
  | 'over25'

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
}

export type Wallet = {
  tokens: number
}

