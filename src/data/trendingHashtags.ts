/**
 * Hashtags suggérés sous la recherche (hub desktop).
 * Le `tag` est sans # ; l’UI affiche #tag et envoie la même chaîne à la recherche.
 */
export type TrendingHashtag = {
  tag: string
  /** Intensité relative (1–100) — pastille « chaleur » */
  heat: number
}

/** Ordre : le hub n’affiche que les 3 premiers par défaut. */
export const TRENDING_HASHTAGS: TrendingHashtag[] = [
  { tag: 'TalkFoot', heat: 100 },
  { tag: 'Ligue1', heat: 88 },
  { tag: 'Mercato', heat: 82 },
  { tag: 'Tribunes', heat: 76 },
  { tag: 'LDC', heat: 71 },
  { tag: 'Virage', heat: 68 },
  { tag: 'CoupeDeFrance', heat: 64 },
  { tag: 'Live', heat: 59 },
]
