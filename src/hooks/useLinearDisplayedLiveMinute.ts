import type { Match } from '../types/match'

/** Minute affichée = minute SportMonks (pas d’avance artificielle côté client). */
export function useLinearDisplayedLiveMinute(match: Match | null | undefined): number {
  return Math.min(99, Math.max(0, Math.round(Number(match?.minute) || 0)))
}
