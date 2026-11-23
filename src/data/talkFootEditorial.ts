/** Éditorial Match Talk Foot — listes modifiables à la main. */

/** Clubs Ligue 1 considérés « top 5 » : un match entre deux d’entre eux est un choc. */
export const LIGUE1_TOP5_IDS = ['psg', 'om', 'monaco', 'lille', 'lyon'] as const

/** Derbys / Classique — ordre indifférent. */
export const LIGUE1_CHOC_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['psg', 'om'],
  ['psg', 'lyon'],
  ['psg', 'monaco'],
  ['psg', 'lille'],
  ['om', 'lyon'],
  ['om', 'nice'],
  ['lille', 'lens'],
  ['lyon', 'stetienne'],
  ['monaco', 'nice'],
  ['lens', 'lille'],
]

export const EUROPE_COMPETITION_IDS = ['ucl', 'uel', 'uecl'] as const
export type EuropeCompetitionId = (typeof EUROPE_COMPETITION_IDS)[number]

/**
 * Forcer le Match Talk Foot d’un jour (clé calendrier Paris `YYYY-MM-DD` → id match).
 * Ex. `{ '2026-11-25': 'm-sm-19715542' }`
 */
export const TALKFOOT_FORCE_BY_DAY: Record<string, string> = {}

export const EUROPE_MULTIPLEX_TITLES: Record<EuropeCompetitionId, string> = {
  ucl: 'Multiplex Ligue des champions',
  uel: 'Multiplex Europa League',
  uecl: 'Multiplex Conference League',
}
