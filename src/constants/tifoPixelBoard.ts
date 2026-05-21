export const TIFO_BOARD_W = 36
export const TIFO_BOARD_H = 22
export const TIFO_MAX_PER_USER_DAY = 3

export const TIFO_DEFAULT_PALETTE = [
  '#ffffff',
  '#e2e8f0',
  '#1e293b',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
] as const

export function tifoPixelKey(x: number, y: number) {
  return `${x},${y}`
}

export function tifoTodayKeyUtc() {
  return new Date().toISOString().slice(0, 10)
}

/** Clé locale : une grille tifo par groupe + match. */
export function tifoBoardScopeKey(groupId: string, matchId: string) {
  return `${groupId}::${matchId}`
}
