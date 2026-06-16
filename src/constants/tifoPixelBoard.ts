export const TIFO_BOARD_W = 36
export const TIFO_BOARD_H = 22
export const TIFO_BOARD_CELL_COUNT = TIFO_BOARD_W * TIFO_BOARD_H
export const TIFO_MAX_PER_USER_DAY = 3

/** Bonus pixels (une fois / jour / tribune / match) — voir sync_match_tifo_engagement_bonuses. */
export const TIFO_ENGAGEMENT_BONUSES = {
  chat_sent: 3,
  message_liked: 1,
  debate_reply: 2,
  match_bet: 3,
  chat_active_10: 2,
} as const

export const TIFO_MAX_ENGAGEMENT_BONUS =
  TIFO_ENGAGEMENT_BONUSES.chat_sent +
  TIFO_ENGAGEMENT_BONUSES.message_liked +
  TIFO_ENGAGEMENT_BONUSES.debate_reply +
  TIFO_ENGAGEMENT_BONUSES.match_bet +
  TIFO_ENGAGEMENT_BONUSES.chat_active_10

/** Palette tifo : 9 couleurs sRGB pleines (rendu opaque PC / mobile). */
export const TIFO_DEFAULT_PALETTE = [
  'rgb(0, 0, 255)', // bleu
  'rgb(0, 220, 0)', // vert
  'rgb(255, 0, 0)', // rouge
  'rgb(255, 230, 0)', // jaune
  'rgb(255, 120, 0)', // orange
  'rgb(255, 0, 255)', // magenta
  'rgb(0, 220, 255)', // cyan
  'rgb(0, 0, 0)', // noir
  'rgb(255, 255, 255)', // blanc
] as const

/** Affichage : hex legacy → rgb sRGB pour un rendu homogène mobile / desktop. */
export function normalizeTifoDisplayColor(color: string): string {
  const c = color.trim()
  if (c.startsWith('rgb')) return c
  const m = /^#?([0-9a-f]{6})$/i.exec(c)
  if (!m?.[1]) return c
  const hex = m[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

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
