export const TIFO_BOARD_W = 36
export const TIFO_BOARD_H = 22
export const TIFO_MAX_PER_USER_DAY = 3

/** Palette tifo : 8 couleurs de base (ordre UI). */
export const TIFO_DEFAULT_PALETTE = [
  '#0000ff', // bleu
  '#00ff00', // vert
  '#ff0000', // rouge
  '#ffff00', // jaune
  '#ff00ff', // magenta
  '#00ffff', // cyan
  '#000000', // noir
  '#ffffff', // blanc
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
