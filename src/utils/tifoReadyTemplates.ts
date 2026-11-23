import {
  TIFO_BOARD_H,
  TIFO_BOARD_W,
  TIFO_DEFAULT_PALETTE,
  normalizeTifoDisplayColor,
} from '../constants/tifoPixelBoard'
import type { Match } from '../types/match'

export type TifoTemplateId = 'camps' | 'echarpe' | 'lettres'

export type MatchTifoTemplate = {
  id: TifoTemplateId
  label: string
  hint: string
  /** Couleur palette par case, ou null si hors modèle. */
  cells: Array<string | null>
}

const GLYPHS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['111', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '101', '101', '101'],
  N: ['101', '111', '111', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '110', '001'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '011'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '101', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
}

function emptyCells(w = TIFO_BOARD_W, h = TIFO_BOARD_H): Array<string | null> {
  return new Array(w * h).fill(null)
}

function setCell(cells: Array<string | null>, x: number, y: number, color: string, w = TIFO_BOARD_W, h = TIFO_BOARD_H) {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  cells[y * w + x] = color
}

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const n = normalizeTifoDisplayColor(color)
  const m = /^#([0-9a-f]{6})$/i.exec(n)
  if (!m) return null
  const v = Number.parseInt(m[1], 16)
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

/** Aligne la couleur club sur la palette tifo (contrainte serveur). */
export function snapTifoPaletteColor(color: string, avoid?: string): string {
  const rgb = parseHex(color)
  let best = TIFO_DEFAULT_PALETTE[2] as string
  let bestDist = Number.POSITIVE_INFINITY
  for (const p of TIFO_DEFAULT_PALETTE) {
    if (avoid && p === avoid) continue
    const pr = parseHex(p)
    if (!pr) continue
    if (!rgb) {
      best = p
      break
    }
    const d = (pr.r - rgb.r) ** 2 + (pr.g - rgb.g) ** 2 + (pr.b - rgb.b) ** 2
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

function clubWord(team: Match['home']): string {
  const raw = (team.shortName || team.name || '?').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw) return '?'
  return raw.slice(0, 3)
}

function drawWord(cells: Array<string | null>, word: string, originX: number, originY: number, color: string) {
  let x = originX
  for (const ch of word) {
    const glyph = GLYPHS[ch] ?? GLYPHS.I
    if (!glyph) continue
    for (let gy = 0; gy < glyph.length; gy++) {
      const row = glyph[gy] ?? ''
      for (let gx = 0; gx < row.length; gx++) {
        if (row[gx] === '1') setCell(cells, x + gx, originY + gy * 2, color)
        if (row[gx] === '1') setCell(cells, x + gx, originY + gy * 2 + 1, color)
      }
    }
    x += 4
  }
}

function matchClubColors(match: Match): { home: string; away: string } {
  const home = snapTifoPaletteColor(match.home.colors.primary)
  const away = snapTifoPaletteColor(match.away.colors.primary, home)
  return { home, away }
}

function campsTemplate(match: Match): MatchTifoTemplate {
  const { home, away } = matchClubColors(match)
  const cells = emptyCells()
  const mid = Math.floor(TIFO_BOARD_W / 2)
  for (let y = 2; y < TIFO_BOARD_H - 2; y++) {
    for (let x = 2; x < mid - 1; x++) setCell(cells, x, y, home)
    for (let x = mid + 1; x < TIFO_BOARD_W - 2; x++) setCell(cells, x, y, away)
  }
  return {
    id: 'camps',
    label: `${match.home.shortName} | ${match.away.shortName}`,
    hint: `Deux camps : ${match.home.shortName} à gauche, ${match.away.shortName} à droite.`,
    cells,
  }
}

function scarfTemplate(match: Match): MatchTifoTemplate {
  const { home, away } = matchClubColors(match)
  const cells = emptyCells()
  const bands = [home, away, home, away, home]
  const bandH = 3
  let y0 = 3
  for (const color of bands) {
    for (let y = y0; y < y0 + bandH && y < TIFO_BOARD_H - 2; y++) {
      for (let x = 2; x < TIFO_BOARD_W - 2; x++) setCell(cells, x, y, color)
    }
    y0 += bandH
  }
  return {
    id: 'echarpe',
    label: 'Écharpe',
    hint: `Écharpe ${match.home.shortName} / ${match.away.shortName} aux couleurs des deux clubs.`,
    cells,
  }
}

function lettersTemplate(match: Match): MatchTifoTemplate {
  const { home, away } = matchClubColors(match)
  const cells = emptyCells()
  const left = clubWord(match.home)
  const right = clubWord(match.away)
  drawWord(cells, left, 3, 5, home)
  drawWord(cells, right, TIFO_BOARD_W - 2 - right.length * 4, 5, away)
  return {
    id: 'lettres',
    label: `${clubWord(match.home)} – ${clubWord(match.away)}`,
    hint: `Initiales du match : ${match.home.shortName} contre ${match.away.shortName}.`,
    cells,
  }
}

export function buildMatchTifoTemplates(match: Match): MatchTifoTemplate[] {
  return [campsTemplate(match), scarfTemplate(match), lettersTemplate(match)]
}

export function tifoMaskProgress(
  cells: Array<string | null>,
  pixels: Record<string, string>,
): { filled: number; total: number } {
  let filled = 0
  let total = 0
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) continue
    total += 1
    const x = i % TIFO_BOARD_W
    const y = (i / TIFO_BOARD_W) | 0
    if (pixels[`${x},${y}`]) filled += 1
  }
  return { filled, total }
}
