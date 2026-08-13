import {
  addParisCalendarDays,
  endOfParisCalendarDayMs,
  matchCalendarDayKeyParis,
  startOfParisCalendarDayMs,
} from './time'

/**
 * Fenêtre **glissante** (Paris) pour limiter le quota API : ~1 semaine de résultats + ~10 jours
 * de matchs à venir (Big 5 + C1 / C3 / C4). Recalculée chaque jour à partir de « aujourd’hui ».
 */
export const PARIS_SM_WINDOW_DAYS_PAST = 7
export const PARIS_SM_WINDOW_DAYS_FUTURE = 10

/** Fin du calendrier CDM (historique) — uniquement si `cdmExtended: true` est passé explicitement. */
export const CDM2026_CALENDAR_END_DAY = '2026-07-31'

/**
 * Fenêtre calendrier + API SportMonks : bornes `YYYY-MM-DD` et instants ms alignés sur
 * le jour civil **Europe/Paris**.
 *
 * Par défaut : fenêtre club (pas d’extension Mondial). Passer `cdmExtended: true`
 * seulement quand le mode saison CDM est forcé ON.
 */
export function getFootballCalendarWindow(
  referenceDate: Date = new Date(),
  options?: { cdmExtended?: boolean },
) {
  const todayParis = matchCalendarDayKeyParis(referenceDate)
  const from = addParisCalendarDays(todayParis, -PARIS_SM_WINDOW_DAYS_PAST)
  const cdmExtended = options?.cdmExtended === true
  const to = cdmExtended
    ? CDM2026_CALENDAR_END_DAY
    : addParisCalendarDays(todayParis, PARIS_SM_WINDOW_DAYS_FUTURE)
  const cutoffMs = startOfParisCalendarDayMs(from)
  const endMs = endOfParisCalendarDayMs(to)
  const year = Number(todayParis.slice(0, 4))
  return { from, to, cutoffMs, endMs, year, cdmExtended }
}
