export type GroupIntensityInput = {
  messagesToday?: number
  reactionsToday?: number
  onlineNow?: number
}

/**
 * Intensite d'ambiance de tribune:
 * - messages + reactions = signal principal
 * - supporters en ligne = bonus modere
 * - borne entre 12% et 100%
 */
export function computeGroupIntensity(input: GroupIntensityInput): number {
  const messages = Math.max(0, input.messagesToday ?? 0)
  const reactions = Math.max(0, input.reactionsToday ?? 0)
  const online = Math.max(0, input.onlineNow ?? 0)

  const activityScore = messages * 3 + reactions * 2 + online * 1.25
  const normalized = Math.min(100, Math.round(12 + activityScore * 0.85))
  return Math.max(12, normalized)
}
