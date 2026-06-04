const STORAGE_KEY = 'talkfoot.privateLive.v1'

type PrivateLiveEntry = {
  matchId: string
  ownerUserId: string
  enabled: boolean
}

function readAll(): PrivateLiveEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is PrivateLiveEntry =>
        e !== null &&
        typeof e === 'object' &&
        typeof (e as PrivateLiveEntry).matchId === 'string' &&
        typeof (e as PrivateLiveEntry).ownerUserId === 'string' &&
        typeof (e as PrivateLiveEntry).enabled === 'boolean',
    )
  } catch {
    return []
  }
}

function writeAll(entries: PrivateLiveEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 40)))
  } catch {
    /* quota */
  }
}

export function getPrivateLiveEntry(matchId: string): PrivateLiveEntry | null {
  return readAll().find((e) => e.matchId === matchId && e.enabled) ?? null
}

export function isPrivateLiveSalon(matchId: string | undefined): boolean {
  if (!matchId) return false
  return getPrivateLiveEntry(matchId) !== null
}

export function setPrivateLiveSalon(
  matchId: string,
  ownerUserId: string,
  enabled: boolean,
): void {
  const rest = readAll().filter((e) => e.matchId !== matchId)
  if (enabled) {
    writeAll([{ matchId, ownerUserId, enabled: true }, ...rest])
  } else {
    writeAll(rest)
  }
}

export function buildPrivateLiveChannelUrl(matchId: string, origin = window.location.origin): string {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') || ''
  return `${origin}${base}/channel/${matchId}?salon=prive`
}
