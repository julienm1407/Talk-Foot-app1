import { useMemo } from 'react'
import { useUserBets } from './useUserBets'
import { useProfile } from './useProfile'
import { useAppearance } from '../contexts/AppearanceContext'
import {
  buildPronoBadges,
  buildPronoProgress,
  computePronoHubStats,
} from '../utils/pronoStatsFromBets'

export function usePronoStats() {
  const [bets] = useUserBets()
  const { profile } = useProfile()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return useMemo(() => {
    const stats = computePronoHubStats(bets)
    return {
      stats,
      badges: buildPronoBadges(stats, L, { cdmBetaParticipant: profile.cdmBetaParticipant }),
      progress: buildPronoProgress(stats),
    }
  }, [bets, L, profile.cdmBetaParticipant])
}
