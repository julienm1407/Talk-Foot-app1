/** Plafond XP local : un cloud en retard ne doit pas rétrograder le niveau au reconnect. */

function storageKey(userId: string): string {
  return `talkfoot.xp.highwater.v1.${userId.trim()}`
}

export function readXpHighwater(userId: string): number {
  if (typeof localStorage === 'undefined') return 0
  const id = userId.trim()
  if (!id) return 0
  try {
    const raw = localStorage.getItem(storageKey(id))
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function writeXpHighwater(userId: string, xp: number): void {
  if (typeof localStorage === 'undefined') return
  const id = userId.trim()
  if (!id) return
  const n = Math.max(0, Math.floor(Number(xp) || 0))
  const prev = readXpHighwater(id)
  if (n <= prev) return
  try {
    localStorage.setItem(storageKey(id), String(n))
  } catch {
    /* quota */
  }
}

export function mergeXpHighwater(serverXp: number, sessionXp: number, backupXp: number): number {
  return Math.max(0, Math.floor(serverXp) || 0, Math.floor(sessionXp) || 0, Math.floor(backupXp) || 0)
}
