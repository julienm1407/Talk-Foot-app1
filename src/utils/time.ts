/** Affichage agenda / coup d’envoi aligné sur le fuseau France (SportMonks renvoie l’instant en UTC). */
import { formatFlashscoreMatchMinute } from './liveMatchClock'

export const MATCH_DISPLAY_TIME_ZONE = 'Europe/Paris'

const parisDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MATCH_DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Clé `YYYY-MM-DD` du jour civil à Paris pour un instant ISO (UTC). */
export function matchCalendarDayKeyParis(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return parisDayFormatter.format(d)
}

/** Jour civil Paris suivant une clé `YYYY-MM-DD` (Paris). */
export function parisCalendarDayAfter(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const anchor = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0))
  return matchCalendarDayKeyParis(anchor)
}

/** Jour civil Paris précédent une clé `YYYY-MM-DD` (Paris). */
export function parisCalendarDayBefore(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const anchor = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0))
  return matchCalendarDayKeyParis(anchor)
}

/** Décale une clé `YYYY-MM-DD` Paris de `delta` jours (delta négatif = passé). */
export function addParisCalendarDays(ymd: string, delta: number): string {
  let k = ymd
  const n = Math.abs(delta)
  const forward = delta >= 0
  for (let i = 0; i < n; i++) {
    k = forward ? parisCalendarDayAfter(k) : parisCalendarDayBefore(k)
  }
  return k
}

/** Toutes les clés `YYYY-MM-DD` Paris de `fromYmd` à `toYmd` incluses (`fromYmd` ≤ `toYmd`). */
export function parisCalendarDayKeysInclusive(fromYmd: string, toYmd: string): string[] {
  if (fromYmd > toYmd) return []
  const out: string[] = []
  let k = fromYmd
  while (true) {
    out.push(k)
    if (k >= toYmd) break
    k = parisCalendarDayAfter(k)
  }
  return out
}

/** Premier instant (ms UTC) du jour civil `ymd` à Paris. */
export function startOfParisCalendarDayMs(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  let lo = Date.UTC(y, m - 1, d, 12, 0, 0) - 40 * 3600 * 1000
  while (matchCalendarDayKeyParis(new Date(lo)) >= ymd) lo -= 3600 * 1000
  let hi = Date.UTC(y, m - 1, d, 12, 0, 0) + 40 * 3600 * 1000
  while (matchCalendarDayKeyParis(new Date(hi)) < ymd) hi += 3600 * 1000
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (matchCalendarDayKeyParis(new Date(mid)) < ymd) lo = mid
    else hi = mid
  }
  return hi
}

/** Dernier instant (ms UTC) du jour civil `ymd` à Paris. */
export function endOfParisCalendarDayMs(ymd: string): number {
  return startOfParisCalendarDayMs(parisCalendarDayAfter(ymd)) - 1
}

export function formatKickoff(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: MATCH_DISPLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Libellé court type hub : Aujourd’hui / Demain / jeu. 24 avr. (fuseau Paris). */
export function formatHubDayLabel(iso: string) {
  const kMatch = matchCalendarDayKeyParis(iso)
  const kToday = matchCalendarDayKeyParis(new Date())
  if (kMatch === kToday) return "Aujourd'hui"
  if (kMatch === parisCalendarDayAfter(kToday)) return 'Demain'
  const d = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: MATCH_DISPLAY_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export type LiveClockFormatOptions = {
  inSecondHalf?: boolean
  paused?: boolean
}

export function formatRelativeMinute(minute?: number, opts?: LiveClockFormatOptions) {
  if (opts?.paused) return 'Mi-temps'
  if (minute == null || minute <= 0) return ''
  return formatFlashscoreMatchMinute(minute, opts)
}

/** Minute live ou « Mi-temps » quand l’horloge API est en pause. */
export function formatLiveMatchClock(
  minute?: number,
  paused?: boolean,
  inSecondHalf?: boolean,
) {
  if (paused) return 'Mi-temps'
  if (minute == null || minute <= 0) return '—'
  return formatFlashscoreMatchMinute(minute, { inSecondHalf }) || '—'
}
