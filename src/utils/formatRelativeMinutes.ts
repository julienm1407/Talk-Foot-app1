/** Affiche une durée relative lisible (min → h → j → sem. → mois). */
export function formatRelativeMinutesAgo(
  minutes: number,
  opts?: { sentenceCase?: boolean },
): string {
  const m = Math.max(0, Math.floor(minutes))
  const lead = opts?.sentenceCase ? 'Il y a' : 'il y a'

  if (m < 1) return `${lead} 1 min`
  if (m < 60) return `${lead} ${m} min`

  const hours = Math.round(m / 60)
  if (m < 60 * 24) return `${lead} ${hours} h`

  const days = Math.round(m / (60 * 24))
  if (days < 14) return `${lead} ${days} j`

  const weeks = Math.round(days / 7)
  if (days < 60) return `${lead} ${weeks} sem.`

  const months = Math.max(1, Math.round(days / 30))
  return `${lead} ${months} mois`
}
