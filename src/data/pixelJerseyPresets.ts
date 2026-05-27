/**
 * Maillots pixel : silhouette de maillot (vue face), puis couleurs / motifs par équipe.
 * Aucun logo, sponsor ni marque — inspiration stylistique uniquement.
 */

export const PIXEL_PALETTE: Record<string, string> = {
  '.': 'transparent',
  O: '#2d3748',
  w: '#ffffff',
  d: '#e5e7eb',
  g: '#fbbf24',
  G: '#d97706',
  n: '#1e3a8a',
  r: '#a82525',
  R: '#dc2626',
  b: '#2563eb',
  k: '#111827',
  l: '#93c5fd',
  L: '#3b82f6',
  m: '#0f2744',
  M: '#172554',
  p: '#be185d',
  s: '#475569',
  t: '#0ea5e9',
  y: '#eab308',
  u: '#b45309',
  c: '#64748b',
}

export type PixelJerseyPresetId =
  | 'iberian_white_gold'
  | 'barca_stripes'
  | 'psg_tricolor'
  | 'liverpool_red'
  | 'bayern_band'
  | 'city_sky'
  | 'inter_nera'
  | 'arsenal_sleeves'

export type PresetDef = { rows: string[]; cols: number }

const COLS = 42

/**
 * Silhouette générée (union torse trapèze + manches ellipsoïdes − encolure), puis contour.
 * Forme en T : manches courtes saillantes, emmanchures, torse plus étroit que les épaules, ourlet incurvé.
 */
const MASK: string[] = [
  '...................@@@@...................',
  '.................@@@@@@@@.................',
  '.................@@@@@@@@.................',
  '.................@@@@@@@@.................',
  '.OOOOOOOOOOO..OOO@@@@@@@@OOO..OOOOOOOOOOO.',
  '.OSSSSSSSSSO.OFFFFF@@@@FFFFFO.OSSSSSSSSSO.',
  '.OSSSSSSSSSO.OFFFFFFFFFFFFFFO.OSSSSSSSSSO.',
  '..OSSSSSSSO.OFFFFFFFFFFFFFFFFO.OSSSSSSSO..',
  '..OOSSSSSOO.OFFFFFFFFFFFFFFFFO.OOSSSSSOO..',
  '....OOOOO...OFFFFFFFFFFFFFFFFO...OOOOO....',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '............OFFFFFFFFFFFFFFFFO............',
  '.............OFFFFFFFFFFFFFFO.............',
  '.............OFFFFFFFFFFFFFFO.............',
  '..............OFFFFFFFFFFFFO..............',
  '..............OFFFFFFFFFFFFO..............',
  '..............OOOOOOOOOOOOOO..............',
]

type Ctx = { row: number; col: number; cols: number }

type FillRule = {
  fabric: (z: Ctx) => string
  sleeve?: (z: Ctx) => string
}

const RULES: Record<PixelJerseyPresetId, FillRule> = {
  iberian_white_gold: {
    fabric: ({ row, col }) => {
      // Disque abstrait poitrine gauche (pas d’écusson)
      const dr = row - 12
      const dc = col - 14
      const q = dr * dr + dc * dc
      if (q <= 2) return 'b'
      if (q <= 5) return 'g'
      const curve = Math.floor((row - 9) / 4)
      const left = 15 + (curve > 2 ? 1 : 0)
      const right = 26 - (curve > 2 ? 1 : 0)
      if (row >= 10 && row <= 22 && (col === left || col === left + 1 || col === right || col === right - 1))
        return 'g'
      if ((row + col) % 5 === 0) return 'd'
      return 'w'
    },
    sleeve: ({ row, col }) => ((row + col) % 4 === 0 ? 'd' : 'w'),
  },

  barca_stripes: {
    fabric: ({ col }) => ((col + 2) % 4 < 2 ? 'n' : 'r'),
    sleeve: ({ col }) => ((col + 2) % 4 < 2 ? 'n' : 'r'),
  },

  psg_tricolor: {
    fabric: ({ col }) => {
      const mid = (COLS - 1) / 2
      if (Math.abs(col - mid) <= 1.5) return 'R'
      return 'm'
    },
    sleeve: ({ col }) => {
      const mid = (COLS - 1) / 2
      if (Math.abs(col - mid) <= 2) return 'R'
      return 'm'
    },
  },

  liverpool_red: {
    fabric: ({ row, col }) => ((row + col) % 6 === 0 ? 'u' : 'R'),
    sleeve: ({ row, col }) => ((row + col) % 5 === 0 ? 'u' : 'R'),
  },

  bayern_band: {
    fabric: ({ row }) => (row >= 11 && row <= 13 ? 'w' : 'R'),
    sleeve: () => 'R',
  },

  city_sky: {
    fabric: ({ row, col }) => (col % 5 === 0 || row % 7 === 0 ? 'L' : 'l'),
    sleeve: ({ col }) => (col % 4 === 0 ? 'L' : 'l'),
  },

  inter_nera: {
    fabric: ({ col }) => (col % 4 < 2 ? 'k' : 'b'),
    sleeve: ({ col }) => (col % 4 < 2 ? 'k' : 'b'),
  },

  arsenal_sleeves: {
    fabric: () => 'R',
    sleeve: () => 'w',
  },
}

function buildRows(id: PixelJerseyPresetId): string[] {
  const rule = RULES[id]
  return MASK.map((line, row) =>
    line
      .split('')
      .map((ch, col) => {
        if (ch === '.' || ch === '@') return '.'
        if (ch === 'O') return 'O'
        const z: Ctx = { row, col, cols: COLS }
        if (ch === 'S') return rule.sleeve?.(z) ?? rule.fabric(z)
        if (ch === 'F') return rule.fabric(z)
        return '.'
      })
      .join(''),
  )
}

if (import.meta.env?.DEV) {
  MASK.forEach((line, i) => {
    if (line.length !== COLS) {
      console.error(
        `[Talk Foot] pixelJerseyPresets: MASK ligne ${i} longueur ${line.length}, attendu ${COLS}`,
      )
    }
  })
}

function allPresets(): Record<PixelJerseyPresetId, PresetDef> {
  const ids = Object.keys(RULES) as PixelJerseyPresetId[]
  return Object.fromEntries(
    ids.map((id) => [id, { rows: buildRows(id), cols: COLS }] as const),
  ) as Record<PixelJerseyPresetId, PresetDef>
}

export const PIXEL_JERSEY_PRESETS: Record<PixelJerseyPresetId, PresetDef> = allPresets()
