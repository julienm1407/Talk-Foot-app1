export function formatKickoff(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeMinute(minute?: number) {
  if (minute == null || minute <= 0) return ''
  if (minute > 90) return `${90}+${minute - 90}'`
  return `${minute}'`
}

