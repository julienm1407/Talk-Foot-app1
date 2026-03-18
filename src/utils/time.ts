export function formatKickoff(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeMinute(minute?: number) {
  if (!minute || minute <= 0) return ''
  return `${minute}'`
}

