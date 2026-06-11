export type GroupIntensityInput = {
  messagesToday?: number
  reactionsToday?: number
  onlineNow?: number
}

/**
 * Intensité d'ambiance (0–100) à partir de l'activité réelle du salon :
 * messages du jour, réactions et supporters actifs récemment.
 * Retourne 0 s'il n'y a aucune activité (pas de pourcentage « fantôme »).
 */
export function computeGroupIntensity(input: GroupIntensityInput): number {
  const messages = Math.max(0, input.messagesToday ?? 0)
  const reactions = Math.max(0, input.reactionsToday ?? 0)
  const online = Math.max(0, input.onlineNow ?? 0)

  if (messages === 0 && reactions === 0 && online === 0) return 0

  const activityScore = messages * 4 + reactions * 2 + online * 6
  // ~20 messages + quelques réactions + 2 en ligne ≈ 85–100 %
  const normalized = Math.min(100, Math.round((activityScore / 110) * 100))
  return Math.max(1, normalized)
}

export function formatGroupAmbianceLabel(intensity: number): string | null {
  if (intensity <= 0) return null
  return `${intensity}% ambiance`
}
