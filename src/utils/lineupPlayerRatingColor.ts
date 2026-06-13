/** Couleur note joueur (style Flashscore : haut = bleu, bas = rouge). */
export function lineupRatingBackground(rating: number): string {
  const r = Math.max(0, Math.min(10, rating))
  if (r >= 9) return '#1d4ed8'
  if (r >= 8) return '#2563eb'
  if (r >= 7) return '#16a34a'
  if (r >= 6) return '#ca8a04'
  if (r >= 5) return '#ea580c'
  return '#dc2626'
}

export function formatLineupRating(rating: number): string {
  const r = Math.round(rating * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}
