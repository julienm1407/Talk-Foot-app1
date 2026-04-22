/**
 * Recherches tendance (démo) — mots les plus recherchés sur les 12 dernières heures.
 * À remplacer par un endpoint analytics / agrégation temps réel.
 */
export type TrendingSearchTerm = {
  /** Libellé affiché & envoyé vers la barre de recherche */
  term: string
  /** Intensité relative (1–100) — pour l’indicateur visuel */
  heat: number
}

/**
 * L’ordre compte : le hub n’affiche que les 3 premiers, courts pour tenir sans scroll.
 * Le reste peut servir d’extension (API, A/B) plus tard.
 */
export const TRENDING_SEARCH_12H: TrendingSearchTerm[] = [
  { term: 'PSG', heat: 100 },
  { term: 'LDC', heat: 88 },
  { term: 'OM', heat: 64 },
  { term: 'Real Madrid', heat: 91 },
  { term: 'Ligue 1', heat: 72 },
  { term: 'Mercato', heat: 68 },
  { term: 'Liverpool', heat: 84 },
  { term: 'Haaland', heat: 55 },
]
