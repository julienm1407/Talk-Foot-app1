import { useMemo } from 'react'
import { useUserBets } from './useUserBets'
import { useAppearance } from '../contexts/AppearanceContext'
import {
  buildPronoBadges,
  buildPronoProgress,
  computePronoHubStats,
} from '../utils/pronoStatsFromBets'

export function usePronoStats() {
  const [bets] = useUserBets()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return useMemo(() => {
    const stats = computePronoHubStats(bets)
    return {
      stats,
      badges: buildPronoBadges(stats, L),
      progress: buildPronoProgress(stats),
    }
  }, [bets, L])
}
