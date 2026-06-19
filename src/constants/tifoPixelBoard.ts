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

/** Palette tifo : hex courts (≤7 car.) — compatible limite serveur place_match_tifo_pixel. */
export const TIFO_DEFAULT_PALETTE = [
  '#0000ff', // bleu
  '#00dc00', // vert
  '#ff0000', // rouge
  '#ffe600', // jaune
  '#ff7800', // orange
  '#ff00ff', // magenta
  '#00dcff', // cyan
  '#000000', // noir
  '#ffffff', // blanc
] as const

/** Fond des cases vides — assez clair en thème sombre pour distinguer le noir (#000). */
export const TIFO_EMPTY_FILL_LIGHT = 'rgb(238, 242, 246)'
export const TIFO_EMPTY_FILL_DARK = 'rgb(100, 116, 139)'

const TIFO_LEGACY_RGB_TO_HEX: Record<string, string> = {
  'rgb(0, 0, 255)': '#0000ff',
  'rgb(0,220,0)': '#00dc00',
  'rgb(0, 220, 0)': '#00dc00',
  'rgb(255, 0, 0)': '#ff0000',
  'rgb(255, 230, 0)': '#ffe600',
  'rgb(255, 120, 0)': '#ff7800',
  'rgb(255, 0, 255)': '#ff00ff',
  'rgb(0, 220, 255)': '#00dcff',
  'rgb(0,0,0)': '#000000',
  'rgb(0, 0, 0)': '#000000',
  'rgb(255, 255, 255)': '#ffffff',
}

/** Normalise une couleur tifo pour affichage + envoi serveur. */
export function normalizeTifoDisplayColor(color: string): string {
  const c = color.trim().toLowerCase().replace(/\s+/g, ' ')
  if (TIFO_LEGACY_RGB_TO_HEX[c]) return TIFO_LEGACY_RGB_TO_HEX[c]!
  if (c.startsWith('#')) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)
    if (m?.[1]) {
      const hex = m[1]
      if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase()
      }
      return `#${hex.toLowerCase()}`
    }
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c)
  if (rgb) {
    const key = `rgb(${rgb[1]}, ${rgb[2]}, ${rgb[3]})`
    if (TIFO_LEGACY_RGB_TO_HEX[key]) return TIFO_LEGACY_RGB_TO_HEX[key]!
    const r = Number(rgb[1])
    const g = Number(rgb[2])
    const b = Number(rgb[3])
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  return color
}

/** Couleur canonique envoyée à Supabase (hex #rrggbb). */
export function normalizeTifoStorageColor(color: string): string {
  return normalizeTifoDisplayColor(color)
}

export function isTifoBlackColor(color: string): boolean {
  return normalizeTifoDisplayColor(color) === '#000000'
}

export function isTifoWhiteColor(color: string): boolean {
  return normalizeTifoDisplayColor(color) === '#ffffff'
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

/** Quota consommé ? Case vide ou écrasement d'un autre joueur (pas si propriétaire inconnu). */
export function tifoPixelChargesQuota(
  previousColor: string | undefined,
  previousOwner: string | undefined,
  uid: string,
): boolean {
  if (!previousColor) return true
  if (!previousOwner) return false
  return previousOwner !== uid
}
