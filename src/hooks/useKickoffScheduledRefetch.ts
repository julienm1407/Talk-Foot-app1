import { useEffect } from 'react'
import type { Match } from '../types/match'
import { computeKickoffRefreshFireTimes } from '../utils/kickoffRefreshSchedule'

/**
 * Lance un `fetch` silencieux aux instants calculés autour des coups d’envoi (T−1min, T, T+2min),
 * sans polling permanent — à combiner avec un filet de sécurité (intervalle long).
 */
export function useKickoffScheduledRefetch(
  matches: readonly Match[],
  runSilentFetch: () => void | Promise<unknown>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const times = computeKickoffRefreshFireTimes(matches)
    const handles: number[] = []
    for (const fireAt of times) {
      const delay = fireAt - Date.now()
      if (delay < 2_000) continue
      handles.push(
        window.setTimeout(() => {
          void runSilentFetch()
        }, delay),
      )
    }
    return () => {
      for (const h of handles) window.clearTimeout(h)
    }
  }, [matches, enabled, runSilentFetch])
}
