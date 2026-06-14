import { formatFlashscoreMatchMinute } from './liveMatchClock'

export type SmEventMinuteRow = {
  minute?: number | null
  extra_minute?: number | null
  period?: {
    counts_from?: number
    description?: string
    type_id?: number
  } | null
}

function periodHalfFlags(row: SmEventMinuteRow): { firstHalf: boolean; secondHalf: boolean } {
  const p = row.period
  const countsFrom = typeof p?.counts_from === 'number' ? p.counts_from : 0
  const desc = String(p?.description ?? '').toLowerCase()
  const firstHalf =
    countsFrom < 45 || desc.includes('1st') || desc.includes('first')
  const secondHalf =
    countsFrom >= 45 || desc.includes('2nd') || desc.includes('second')
  return { firstHalf, secondHalf }
}

/** Minute cumulée match pour tri / affichage (buts, cartons…). */
export function eventMinuteTotal(row: SmEventMinuteRow): number {
  const m = typeof row.minute === 'number' ? row.minute : 0
  const x = typeof row.extra_minute === 'number' ? row.extra_minute : 0
  if (m <= 0 && x <= 0) return 0
  if (x > 0) return m + x

  const { firstHalf, secondHalf } = periodHalfFlags(row)
  const countsFrom =
    typeof row.period?.counts_from === 'number' && row.period.counts_from >= 0
      ? row.period.counts_from
      : 0

  if (firstHalf && !secondHalf) return m

  if (secondHalf) {
    if (m >= countsFrom && countsFrom >= 45) return m
    if (countsFrom >= 45 && m > 0) return countsFrom + m
  }

  return m
}

/** 2e période (pour afficher 45+5 vs 50' en 1re MT). */
export function eventInSecondHalf(row: SmEventMinuteRow, totalMinute?: number): boolean {
  const { firstHalf, secondHalf } = periodHalfFlags(row)
  if (secondHalf && !firstHalf) return true
  if (firstHalf && !secondHalf) return false
  const total = totalMinute ?? eventMinuteTotal(row)
  return total > 50
}

/** Libellé buteur / carton : 45+5' en temps additionnel 1re MT, 67' en 2e MT. */
export function formatGoalEventMinute(
  minute: number,
  opts?: { inSecondHalf?: boolean },
): string {
  if (!Number.isFinite(minute) || minute <= 0) return ''
  return formatFlashscoreMatchMinute(minute, { inSecondHalf: opts?.inSecondHalf })
}

export function formatEventMinuteLabel(row: SmEventMinuteRow): string {
  const total = eventMinuteTotal(row)
  if (total <= 0) return ''
  return formatGoalEventMinute(total, { inSecondHalf: eventInSecondHalf(row, total) })
}
