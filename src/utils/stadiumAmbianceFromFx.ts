/** Nombre de FX tribune pour remplir la jauge d'ambiance stade (0–100 %). */
export const STADIUM_AMBIANCE_FX_FULL = 14

/** Jauge d'ambiance = cumul des FX lancés en tribune pendant le match. */
export function stadiumAmbiancePercentFromFxCount(fxCount: number): number {
  const n = Math.max(0, Math.round(fxCount))
  if (n <= 0) return 0
  return Math.min(100, Math.round((n / STADIUM_AMBIANCE_FX_FULL) * 100))
}

export function stadiumAmbianceTierLabel(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  if (p >= 85) return 'MODE STADE'
  if (p >= 65) return 'AMBIANCE'
  if (p >= 35) return 'ÇA MONTE'
  if (p > 0) return 'TIMIDE'
  return 'CALME'
}
