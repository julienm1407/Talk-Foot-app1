/** Affichage chrono live style Flashscore : 45+2', 67', 90+3', 102' (prolongations), Mi-temps. */
export function formatFlashscoreMatchMinute(
  totalMinute: number,
  opts?: { paused?: boolean; inSecondHalf?: boolean; inExtraTime?: boolean },
): string {
  if (opts?.paused) return 'Mi-temps'

  const t = Math.max(0, Math.round(totalMinute))
  if (t <= 0) return "0'"

  if (opts?.inExtraTime) return `${t}'`

  const inSecondHalf = opts?.inSecondHalf ?? t > 50

  if (inSecondHalf) {
    if (t > 90) return `90+${t - 90}'`
    return `${t}'`
  }

  if (t > 45) return `45+${t - 45}'`
  return `${t}'`
}
