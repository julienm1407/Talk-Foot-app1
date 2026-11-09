import {
  blend1x2Probabilities,
  impliedProbsFromDecimalOdds,
  probabilitiesToDecimalOdds,
} from './internalOddsEngine'
import type { Probabilities1x2, SmBookOdds1x2 } from './types'

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
  if (fav < 1.04 || fav > 8 || dog < 1.2 || dog > 40) return false
  if (external.draw < 2.2 || external.draw > 14) return false
  if (dog / fav > 28) return false

  if (!internal) {
    if (external.home > 6.5 && external.away < 2.4) return false
    if (external.away > 6.5 && external.home < 2.4) return false
    return true
  }

  const aligned = align1x2OddsToInternalFavorite(external, internal)
  const intFav = Math.min(internal.home, internal.away)
  const extFav = Math.min(aligned.home, aligned.away)
  const intDog = Math.max(internal.home, internal.away)
  const extDog = Math.max(aligned.home, aligned.away)

  const favRatio = extFav / intFav
  if (!Number.isFinite(favRatio) || favRatio < 0.48 || favRatio > 2.15) return false

  const dogRatio = extDog / intDog
  if (!Number.isFinite(dogRatio) || dogRatio < 0.45 || dogRatio > 2.8) return false

  const drawRatio = aligned.draw / internal.draw
  if (!Number.isFinite(drawRatio) || drawRatio < 0.48 || drawRatio > 2.4) return false

  if (intDog <= 8 && extDog > 15) return false

  return true
}

/**
 * Mélange cotes SportMonks (forme du marché) et modèle interne (classement / forme / absences).
 * Poids bookmaker plus fort si le triplet est crédible.
 */
export function mixBookmakerWithInternal1x2(
  book: SmBookOdds1x2,
  internalOdds: SmBookOdds1x2,
  internalProbs: Probabilities1x2,
): { odds1x2: SmBookOdds1x2; probs1x2: Probabilities1x2; source: 'bookmaker' | 'talkfoot' } {
  const aligned = align1x2OddsToInternalFavorite(book, internalOdds)
  const smProbs = impliedProbsFromDecimalOdds(aligned)
  const credible = isCredibleExternal1x2Odds(aligned, internalOdds)
  const weightOnBook = credible ? 0.72 : 0.48
  const probs1x2 = blend1x2Probabilities(smProbs, internalProbs, weightOnBook)
  return {
    odds1x2: probabilitiesToDecimalOdds(probs1x2),
    probs1x2,
    source: credible ? 'bookmaker' : 'talkfoot',
  }
}
