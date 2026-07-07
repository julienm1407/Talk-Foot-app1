import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'
import {
  resolveEffectiveMatchStatus,
  type MatchAttentionStatus,
} from '../utils/footballMatchAttention'

/** Recalcule le statut effectif (tick 30 s) pour activer le polling live sans attendre MatchesContext. */
export function useEffectiveMatchStatus(
  match: Pick<Match, 'status' | 'kickoffAt'> | null | undefined,
): MatchAttentionStatus {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return useMemo(
    () => resolveEffectiveMatchStatus(match ?? undefined, nowMs),
    [match, nowMs],
  )
}
