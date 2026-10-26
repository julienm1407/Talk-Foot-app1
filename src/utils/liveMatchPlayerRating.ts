/** Note SM (WhoScored / Opta via SportMonks) : on la garde telle quelle. */
export function isOfficialSmRating(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 10
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Note maison tant que SM n’a pas envoyé `RATING`.
 * Base 6.0, événements du fil live + quelques stats lineup si elles existent.
 */
export function computeLiveMatchPlayerRating(input: {
  smRating?: number
  goals?: number
  ownGoals?: number
  assists?: number
  shotsOnTarget?: number
  yellowCards?: number
  redCards?: number
}): number {
  if (isOfficialSmRating(input.smRating)) return round1(input.smRating)

  const goals = Math.max(0, input.goals ?? 0)
  const ownGoals = Math.max(0, input.ownGoals ?? 0)
  const assists = Math.max(0, input.assists ?? 0)
  const shotsOnTarget = Math.max(0, input.shotsOnTarget ?? 0)
  const yellowCards = Math.max(0, input.yellowCards ?? 0)
  const redCards = Math.max(0, input.redCards ?? 0)

  let r = 6.0
  r += 0.9 * goals
  r += 0.55 * assists
  r += Math.min(0.6, 0.12 * shotsOnTarget)
  r -= 0.85 * ownGoals
  r -= 0.3 * yellowCards
  r -= 1.4 * redCards

  return Math.min(9.8, Math.max(4.0, round1(r)))
}
