import { useMemo } from 'react'
import { useUserBets } from './useUserBets'

/** Stats affichées sur la page Pronostic — basées sur les vrais paris, pas les mocks profil. */
export function useBettingHubStats() {
  const [bets] = useUserBets()

  return useMemo(() => {
    const total = bets.length
    const decided = bets.filter((b) => b.status === 'won' || b.status === 'lost')
    const won = decided.filter((b) => b.status === 'won').length
    const accuracy = decided.length ? Math.round((won / decided.length) * 100) : 0
    const points = bets
      .filter((b) => b.status === 'won')
      .reduce((sum, b) => sum + Math.max(0, (b.payout ?? 0) - (b.stake ?? 0)), 0)

    const settledNewestFirst = [...decided].sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
    )
    let streak = 0
    for (const b of settledNewestFirst) {
      if (b.status !== 'won') break
      streak += 1
    }

    return { total, decided: decided.length, won, accuracy, points, streak }
  }, [bets])
}
