import { isInsideCdm2026Window } from './seasonMode'
import {
  addParisCalendarDays,
  endOfParisCalendarDayMs,
  matchCalendarDayKeyParis,
  startOfParisCalendarDayMs,
} from './time'

/**
 * Fenêtre **glissante** (Paris) pour limiter le quota API : ~1 semaine de résultats + ~10 jours
 * de matchs à venir. Recalculée chaque jour à partir de « aujourd’hui » (ex. 24 avr. → passé
 * depuis le 17 avr., à venir jusqu’au 4 mai ; au 1er mai la fenêtre se décale avec les mêmes durées).
 */
export const PARIS_SM_WINDOW_DAYS_PAST = 7
export const PARIS_SM_WINDOW_DAYS_FUTURE = 10

/** Fin du calendrier CDM affiché (aligné sur la fenêtre mode saison `cdm2026`). */
export const CDM2026_CALENDAR_END_DAY = '2026-07-31'

/**
 * Fenêtre calendrier + API SportMonks : bornes `YYYY-MM-DD` et instants ms alignés sur
 * le jour civil **Europe/Paris**.
 */
export function getFootballCalendarWindow(
  referenceDate: Date = new Date(),
  options?: { cdmExtended?: boolean },
) {
  const todayParis = matchCalendarDayKeyParis(referenceDate)
  const from = addParisCalendarDays(todayParis, -PARIS_SM_WINDOW_DAYS_PAST)
  const cdmExtended = options?.cdmExtended ?? isInsideCdm2026Window(referenceDate)
  const to = cdmExtended
    ? CDM2026_CALENDAR_END_DAY
    : addParisCalendarDays(todayParis, PARIS_SM_WINDOW_DAYS_FUTURE)
  const cutoffMs = startOfParisCalendarDayMs(from)
  const endMs = endOfParisCalendarDayMs(to)
  const year = Number(todayParis.slice(0, 4))
  return { from, to, cutoffMs, endMs, year, cdmExtended }
}
