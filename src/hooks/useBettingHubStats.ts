import { useMemo } from 'react'
import { useUserBets } from './useUserBets'
import { computePronoHubStats } from '../utils/pronoStatsFromBets'

/** Stats affichées sur la page Pronostic — basées sur les vrais paris. */
export function useBettingHubStats() {
  const [bets] = useUserBets()
  return useMemo(() => computePronoHubStats(bets), [bets])
}
