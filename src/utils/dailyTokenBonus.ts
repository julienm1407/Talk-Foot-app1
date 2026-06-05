export const DAILY_TOKEN_BONUS_AMOUNT = 35
export const DAILY_TOKEN_BONUS_HOUR = 10
export const DAILY_TOKEN_BONUS_TZ = 'Europe/Paris'

const parisPartsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: DAILY_TOKEN_BONUS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Clé jour calendaire Paris (YYYY-MM-DD) — alignée avec le RPC Supabase. */
export function toParisDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_TOKEN_BONUS_TZ }).format(date)
}

export function parisWallClock(date = new Date()): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
} {
  const parts = parisPartsFormatter.formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0')
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour') % 24,
    minute: pick('minute'),
  }
}

export function isDailyBonusOpenNow(now = new Date()): boolean {
  const { hour, minute } = parisWallClock(now)
  return hour > DAILY_TOKEN_BONUS_HOUR || (hour === DAILY_TOKEN_BONUS_HOUR && minute >= 0)
}

export function nextDailyBonusWindow(now = new Date()): { claimDayKey: string; nextClaimAt: Date } {
  const claimDayKey = toParisDayKey(now)
  const clock = parisWallClock(now)
  const nextClaimAt = new Date(now)
  if (isDailyBonusOpenNow(now)) {
    return { claimDayKey, nextClaimAt }
  }
  // Prochaine ouverture : aujourd'hui 10h Paris (approximation UTC pour l'affichage)
  const utcGuess = Date.UTC(clock.year, clock.month - 1, clock.day, DAILY_TOKEN_BONUS_HOUR - 1, 0, 0)
  nextClaimAt.setTime(utcGuess)
  if (nextClaimAt <= now) {
    nextClaimAt.setTime(now.getTime() + 60_000)
  }
  return { claimDayKey, nextClaimAt }
}

export type DailyTokenBonusStatus = {
  amount: number
  canClaim: boolean
  alreadyClaimedToday: boolean
  nextClaimAt: Date
  claimDayKey: string
}
