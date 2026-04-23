import {
  addParisCalendarDays,
  endOfParisCalendarDayMs,
  matchCalendarDayKeyParis,
  startOfParisCalendarDayMs,
} from './time'

/** Jours avant « aujourd’hui » Paris inclus dans l’appel `fixtures/between`. */
const PARIS_WINDOW_DAYS_PAST = 21
/** Jours après « aujourd’hui » Paris inclus dans l’appel `fixtures/between`. */
const PARIS_WINDOW_DAYS_FUTURE = 70

/**
 * Fenêtre calendrier + API SportMonks : bornes `YYYY-MM-DD` et instants ms alignés sur
 * le jour civil **Europe/Paris** (année = celle de « aujourd’hui » à Paris, pas UTC seul).
 *
 * L’ancienne fenêtre fixe 1er avr. → 30 juin en `Date.UTC` pouvait ne pas coïncider avec
 * ce que l’API attend pour « les matchs de la semaine » côté fuseau français.
 */
export function getFootballCalendarWindow(referenceDate: Date = new Date()) {
  const todayParis = matchCalendarDayKeyParis(referenceDate)
  const from = addParisCalendarDays(todayParis, -PARIS_WINDOW_DAYS_PAST)
  const to = addParisCalendarDays(todayParis, PARIS_WINDOW_DAYS_FUTURE)
  const cutoffMs = startOfParisCalendarDayMs(from)
  const endMs = endOfParisCalendarDayMs(to)
  const year = Number(todayParis.slice(0, 4))
  return { from, to, cutoffMs, endMs, year }
}
