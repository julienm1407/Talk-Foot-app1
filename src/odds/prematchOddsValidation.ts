import type { SmBookOdds1x2 } from './types'

/** Aligne domicile/extérieur si le favori est inversé par rapport au modèle interne. */
export function align1x2OddsToInternalFavorite(
  external: SmBookOdds1x2,
  internal: SmBookOdds1x2,
): SmBookOdds1x2 {
  const extHomeFav = external.home <= external.away
  const intHomeFav = internal.home <= internal.away
  if (extHomeFav === intHomeFav) return external
  return { home: external.away, draw: external.draw, away: external.home }
}

/** Cotes bookmaker plausibles vs modèle Talk Foot (évite 10+ sur un favori domicile). */
export function isCredibleExternal1x2Odds(
  external: SmBookOdds1x2,
  internal: SmBookOdds1x2 | null,
): boolean {
  const fav = Math.min(external.home, external.away)
  const dog = Math.max(external.home, external.away)
  if (fav < 1.04 || fav > 8 || dog < 1.2 || dog > 35) return false
  if (external.draw < 2.4 || external.draw > 12) return false
  if (dog / fav > 22) return false

  if (!internal) {
    if (external.home > 5.5 && external.away < 2.6) return false
    if (external.away > 5.5 && external.home < 2.6) return false
    return true
  }

  const aligned = align1x2OddsToInternalFavorite(external, internal)
  const intFav = Math.min(internal.home, internal.away)
  const extFav = Math.min(aligned.home, aligned.away)
  const intDog = Math.max(internal.home, internal.away)
  const extDog = Math.max(aligned.home, aligned.away)

  const favRatio = extFav / intFav
  if (!Number.isFinite(favRatio) || favRatio < 0.55 || favRatio > 1.85) return false

  const dogRatio = extDog / intDog
  if (!Number.isFinite(dogRatio) || dogRatio < 0.55 || dogRatio > 2.25) return false

  const drawRatio = aligned.draw / internal.draw
  if (!Number.isFinite(drawRatio) || drawRatio < 0.55 || drawRatio > 2) return false

  // Prematch club : outsider bookmaker > 12 peu crédible si le modèle le voit < 8
  if (intDog <= 8 && extDog > 12) return false

  return true
}
