import type { Bet, BetMarket } from '../types/bet'
import { parseExactScoreSelection } from '../odds/exactScoreOdds'
import { scorerLineupMatchesScoredGoal } from './liveFootballOdds'
import { betWinTokenCredit } from './subscriptionEntitlements'
import { newlyWonBetIds } from './xpGrant'

const SCORE_KEY_MAP: Record<string, [number, number]> = {
  '00': [0, 0],
  '10': [1, 0],
  '20': [2, 0],
  '21': [2, 1],
  '11': [1, 1],
  '01': [0, 1],
  '12': [1, 2],
}

function resolvedScore(selection: Bet['selection']): [number, number] | null {
  const parsed = parseExactScoreSelection(selection)
  if (parsed) return [parsed.home, parsed.away]
  const legacy = SCORE_KEY_MAP[String(selection)]
  return legacy ?? null
}

export type SettleMatchBetsOptions = {
  scorerEvents?: { side: 'home' | 'away'; slug: string; name?: string }[]
  /** Limite les marchés réglés (ex. hook global sans buteurs). */
  markets?: BetMarket[]
  now?: string
}

export function settleOpenBetsForMatch(
  bets: Bet[],
  targetMatchId: string,
  finalScore: { home: number; away: number },
  tokenMultiplier: number,
  opts?: SettleMatchBetsOptions,
): { bets: Bet[]; tokenDelta: number; newlyWonBetIds: string[] } {
  const now = opts?.now ?? new Date().toISOString()
  const allowedMarkets = opts?.markets ? new Set(opts.markets) : null
  const { home, away } = finalScore
  const totalGoals = home + away
  const homeWins = home > away
  const awayWins = away > home
  const isDraw = home === away
  const scorerEvents = opts?.scorerEvents ?? []
  let tokenDelta = 0

  const next = bets.map((b) => {
    if (b.matchId !== targetMatchId) return b
    const reclaimLostScorer =
      b.status === 'lost' && b.market === 'anytime_scorer' && !b.tokenCreditApplied
    if (b.status !== 'open' && !reclaimLostScorer) return b
    if (allowedMarkets && !allowedMarkets.has(b.market)) return b

    if (b.market === 'result_1x2') {
      if (b.status !== 'open') return b
      const won =
        (b.selection === 'home' && homeWins) ||
        (b.selection === 'draw' && isDraw) ||
        (b.selection === 'away' && awayWins)
      if (won) {
        const payout = Math.round(b.stake * b.odds)
        tokenDelta += betWinTokenCredit(payout, b.stake, tokenMultiplier)
        return { ...b, status: 'won' as const, settledAt: now, payout, tokenCreditApplied: true }
      }
      return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
    }

    if (b.market === 'over25') {
      if (b.status !== 'open') return b
      const won =
        (b.selection === 'over' && totalGoals > 2) ||
        (b.selection === 'under' && totalGoals <= 2)
      if (won) {
        const payout = Math.round(b.stake * b.odds)
        tokenDelta += betWinTokenCredit(payout, b.stake, tokenMultiplier)
        return { ...b, status: 'won' as const, settledAt: now, payout, tokenCreditApplied: true }
      }
      return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
    }

    if (b.market === 'exact_score') {
      if (b.status !== 'open') return b
      const exp = resolvedScore(b.selection)
      const won = Boolean(exp && exp[0] === home && exp[1] === away)
      if (won) {
        const payout = Math.round(b.stake * b.odds)
        tokenDelta += betWinTokenCredit(payout, b.stake, tokenMultiplier)
        return { ...b, status: 'won' as const, settledAt: now, payout, tokenCreditApplied: true }
      }
      return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
    }

    if (b.market === 'anytime_scorer' && typeof b.selection === 'string' && b.selection.startsWith('scor:')) {
      const rest = b.selection.slice('scor:'.length)
      const idx = rest.indexOf(':')
      if (idx === -1) {
        if (b.status !== 'open') return b
        return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
      }
      const side = rest.slice(0, idx) as 'home' | 'away'
      const slug = rest.slice(idx + 1)
      const won = scorerEvents.some(
        (e) => e.side === side && scorerLineupMatchesScoredGoal(slug, e),
      )
      if (won) {
        // Inclut la reprise lost→won (bug matching ancien : Dembélé / Ferran, etc.).
        const payout = Math.round(b.stake * b.odds)
        if (!b.tokenCreditApplied) {
          tokenDelta += betWinTokenCredit(payout, b.stake, tokenMultiplier)
        }
        return {
          ...b,
          status: 'won' as const,
          settledAt: b.settledAt ?? now,
          payout,
          tokenCreditApplied: true,
        }
      }
      if (b.status !== 'open') return b
      return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
    }

    return b
  })

  return { bets: next, tokenDelta, newlyWonBetIds: newlyWonBetIds(bets, next) }
}

export type ScorerSettleEvent = { side: 'home' | 'away'; slug: string; name?: string }

/**
 * Valide seulement les paris « buteur à tout moment » déjà gagnants (but confirmé).
 * Ne marque pas les autres en perdu — à appeler en live ; la fin de match règle le reste.
 */
export function settleWinningAnytimeScorersOnly(
  bets: Bet[],
  targetMatchId: string,
  scorerEvents: ScorerSettleEvent[],
  tokenMultiplier: number,
  opts?: { now?: string },
): { bets: Bet[]; tokenDelta: number; newlyWonBetIds: string[] } {
  if (!scorerEvents.length) {
    return { bets, tokenDelta: 0, newlyWonBetIds: [] }
  }
  const now = opts?.now ?? new Date().toISOString()
  let tokenDelta = 0

  const next = bets.map((b) => {
    if (b.matchId !== targetMatchId) return b
    if (b.market !== 'anytime_scorer') return b
    if (b.status !== 'open' && b.status !== 'lost') return b
    if (typeof b.selection !== 'string' || !b.selection.startsWith('scor:')) return b

    const rest = b.selection.slice('scor:'.length)
    const idx = rest.indexOf(':')
    if (idx === -1) return b
    const side = rest.slice(0, idx) as 'home' | 'away'
    const slug = rest.slice(idx + 1)
    const won = scorerEvents.some(
      (e) => e.side === side && scorerLineupMatchesScoredGoal(slug, e),
    )
    if (!won) return b
    if (b.tokenCreditApplied) return b

    const payout = Math.round(b.stake * b.odds)
    if (!b.tokenCreditApplied) {
      tokenDelta += betWinTokenCredit(payout, b.stake, tokenMultiplier)
    }
    return {
      ...b,
      status: 'won' as const,
      settledAt: b.settledAt ?? now,
      payout,
      tokenCreditApplied: true,
    }
  })

  return { bets: next, tokenDelta, newlyWonBetIds: newlyWonBetIds(bets, next) }
}
