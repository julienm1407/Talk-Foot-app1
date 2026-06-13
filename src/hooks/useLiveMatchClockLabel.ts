import { useLinearDisplayedLiveMinute } from './useLinearDisplayedLiveMinute'
import type { Match } from '../types/match'
import { formatFlashscoreMatchMinute } from '../utils/liveMatchClock'

/** Chrono live affiché (45+2', Mi-temps, 90+3'…) synchronisé sur SM + défilement linéaire. */
export function useLiveMatchClockLabel(match: Match | null | undefined): string {
  const minute = useLinearDisplayedLiveMinute(match)
  if (!match || match.status !== 'live') {
    return formatFlashscoreMatchMinute(Math.max(0, Math.round(Number(match?.minute) || 0)), {
      inSecondHalf: match?.liveInSecondHalf,
    })
  }
  return formatFlashscoreMatchMinute(minute, {
    paused: match.liveClockPaused,
    inSecondHalf: match.liveInSecondHalf,
  })
}
