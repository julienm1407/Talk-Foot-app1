import { REWARDED_AD_DAILY_CAP } from '../config/admob'
import { toLocalDayKey } from './subscriptionEntitlements'

const KEY = 'talkfoot.ads.rewardedDaily.v1'

type Daily = { day: string; count: number }

function read(): Daily {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { day: toLocalDayKey(new Date()), count: 0 }
    const o = JSON.parse(raw) as Daily
    const day = toLocalDayKey(new Date())
    if (o.day !== day) return { day, count: 0 }
    return { day, count: Math.max(0, Number(o.count) || 0) }
  } catch {
    return { day: toLocalDayKey(new Date()), count: 0 }
  }
}

function write(d: Daily) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* quota */
  }
}

export function rewardedAdsRemainingToday(): number {
  return Math.max(0, REWARDED_AD_DAILY_CAP - read().count)
}

export function consumeRewardedAdSlot(): boolean {
  const cur = read()
  if (cur.count >= REWARDED_AD_DAILY_CAP) return false
  write({ day: cur.day, count: cur.count + 1 })
  return true
}
