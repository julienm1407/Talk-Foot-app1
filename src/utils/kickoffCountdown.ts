export type KickoffCountdownParts = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function kickoffCountdownParts(kickoffIso: string, nowMs = Date.now()): KickoffCountdownParts {
  const kick = Date.parse(kickoffIso)
  const totalMs = Number.isFinite(kick) ? Math.max(0, kick - nowMs) : 0
  const totalSec = Math.floor(totalMs / 1000)
  return {
    totalMs,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    expired: totalMs <= 0,
  }
}

export function formatKickoffCountdown(parts: KickoffCountdownParts): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (parts.days > 0) return `${parts.days}j ${pad(parts.hours)}h ${pad(parts.minutes)}min ${pad(parts.seconds)}s`
  if (parts.hours > 0) return `${pad(parts.hours)}h ${pad(parts.minutes)}min ${pad(parts.seconds)}s`
  return `${pad(parts.minutes)}min ${pad(parts.seconds)}s`
}
