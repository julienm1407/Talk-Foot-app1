/**
 * Identifiants SportMonks — Coupe du Monde FIFA 2026.
 * @see https://docs.sportmonks.com/v3/world-cup-2026/how-to-build-your-world-cup-application
 */
export const SM_WC_2026_LEAGUE_ID = 732

/** Saison tournoi principal (juin–juillet 2026). Surcharge : `VITE_SPORTMONKS_WC_SEASON_ID`. */
export const SM_WC_2026_SEASON_ID_DEFAULT = 26618

export function resolveSportMonksWc2026SeasonId(): number {
  const raw = import.meta.env.VITE_SPORTMONKS_WC_SEASON_ID
  if (raw == null || String(raw).trim() === '') return SM_WC_2026_SEASON_ID_DEFAULT
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : SM_WC_2026_SEASON_ID_DEFAULT
}
