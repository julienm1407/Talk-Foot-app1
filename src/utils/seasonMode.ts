/**
 * Mode saisonnier Talk Foot — bascule globale (DA, navigation, contenus).
 *
 * Pour la Coupe du Monde 2026 (USA · Canada · Mexique), le site passe en
 * mode `cdm2026` durant la fenêtre officielle. Tout est désactivable via
 * un override admin (ON/OFF/auto) — voir SeasonModeContext.
 */

export type SeasonModeId = 'standard' | 'cdm2026'

export type SeasonModeOverride = 'auto' | 'on' | 'off'

/**
 * Fenêtre d'activation automatique du mode CDM 2026 (historique).
 *
 * Mondial terminé : le site est recentré sur les 5 grands championnats et les
 * coupes européennes. La fenêtre reste lisible pour l’admin / tests, mais
 * `auto` ne réactive plus le mode CDM après la fin de compétition.
 */
export const CDM2026_AUTO_WINDOW = {
  start: Date.UTC(2026, 4, 1, 0, 0, 0), // 1er mai 2026 00:00 UTC
  end: Date.UTC(2026, 6, 31, 23, 59, 59), // 31 juillet 2026 23:59 UTC
} as const

/** True uniquement pendant la fenêtre historique May–Jul 2026. */
export function isInsideCdm2026Window(now: Date = new Date()): boolean {
  const t = now.getTime()
  return t >= CDM2026_AUTO_WINDOW.start && t <= CDM2026_AUTO_WINDOW.end
}

/** Mondial terminé : plus d’activation auto du chrome CDM. */
export function isCdm2026SeasonClosed(now: Date = new Date()): boolean {
  return now.getTime() > CDM2026_AUTO_WINDOW.end
}

export function resolveSeasonMode(
  override: SeasonModeOverride,
  now: Date = new Date(),
): SeasonModeId {
  if (override === 'on') return 'cdm2026'
  if (override === 'off') return 'standard'
  return isInsideCdm2026Window(now) ? 'cdm2026' : 'standard'
}

/** Compétition Talk Foot : Coupe du Monde 2026. */
export const WC_2026_COMP_ID = 'wc-2026'

/**
 * Id ligue SportMonks Coupe du Monde 2026 (doc SM : 732).
 * L’ancien id 5 (historique) reste reconnu dans `footballApi` pour compatibilité.
 */
export const SM_LEAGUE_ID_WORLD_CUP = 732

export function isWorldCupCompetitionId(id?: string | null): boolean {
  return id === WC_2026_COMP_ID
}
