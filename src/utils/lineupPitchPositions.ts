/** Positions % sur le terrain (y bas = gardien si invert). */
export const LINEUP_FALLBACK_POSITIONS: Array<{ left: number; top: number }> = [
  { left: 12, top: 12 },
  { left: 38, top: 12 },
  { left: 62, top: 12 },
  { left: 88, top: 12 },
  { left: 12, top: 36 },
  { left: 38, top: 36 },
  { left: 62, top: 36 },
  { left: 88, top: 36 },
  { left: 22, top: 62 },
  { left: 50, top: 62 },
  { left: 78, top: 88 },
]

type ParsedPlayer = {
  name: string
  number?: string
  index: number
  row: number | null
  col: number | null
  formationPosition?: number | null
}

export type LineupBadgePlacement = {
  name: string
  number?: string
  left: number
  top: number
  /** Largeur max du badge en % du terrain (évite le chevauchement). */
  maxWidthPct: number
}

function clampPct(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function fallbackPlacement(i: number, parsed: ParsedPlayer): LineupBadgePlacement {
  const fb = LINEUP_FALLBACK_POSITIONS[i] ?? { left: 50, top: 50 }
  return {
    name: parsed.name,
    number: parsed.number,
    left: fb.left,
    top: clampPct(fb.top, 8, 90),
    maxWidthPct: 24,
  }
}

function parseLineupPlayers(
  players: Array<
    | string
    | {
        label: string
        number?: string
        formationField?: string | null
        formationPosition?: number | null
      }
  >,
): ParsedPlayer[] {
  return players
    .slice(0, 11)
    .map((p, index) => {
      if (typeof p === 'string') return { name: p, index, row: null, col: null }
      const ff = p.formationField
      if (!ff) {
        return {
          name: p.label,
          number: p.number,
          index,
          row: null,
          col: null,
          formationPosition: p.formationPosition,
        }
      }
      const [rowRaw, colRaw] = ff.split(':').map((x) => Number(x.trim()))
      const row = Number.isFinite(rowRaw) ? rowRaw : null
      const col = Number.isFinite(colRaw) ? colRaw : null
      return {
        name: p.label,
        number: p.number,
        index,
        row,
        col,
        formationPosition: p.formationPosition,
      }
    })
    .filter((p) => p.name.trim().length > 0)
}

function horizontalForRow(rowPlayers: ParsedPlayer[]): number[] {
  const n = rowPlayers.length
  if (n === 0) return []
  if (n === 1) return [50]

  const cols = rowPlayers.map((p) => p.col as number)
  const minCol = Math.min(...cols)
  const maxCol = Math.max(...cols)

  if (maxCol > minCol) {
    return cols.map((col) => {
      const t = (col - minCol) / (maxCol - minCol)
      return 6 + t * 88
    })
  }

  const pad = n >= 5 ? 3 : n >= 4 ? 5 : 7
  const span = 100 - pad * 2
  return Array.from({ length: n }, (_, slot) => pad + (slot / (n - 1)) * span)
}

/** Écarte les badges d'une même ligne si leurs centres sont trop proches. */
function resolveRowOverlaps(
  row: Array<{ left: number; maxWidthPct: number }>,
  minGapPct = 2,
): void {
  row.sort((a, b) => a.left - b.left)
  for (let i = 1; i < row.length; i++) {
    const prev = row[i - 1]
    const cur = row[i]
    const needed = (prev.maxWidthPct + cur.maxWidthPct) / 2 + minGapPct
    if (cur.left - prev.left < needed) {
      cur.left = prev.left + needed
    }
  }
  const overflow = row[row.length - 1].left + row[row.length - 1].maxWidthPct / 2 - 97
  if (overflow > 0) {
    for (const item of row) item.left -= overflow
    const underflow = row[0].left - row[0].maxWidthPct / 2 - 3
    if (underflow < 0) {
      for (const item of row) item.left -= underflow
    }
  }
}

export function computeLineupBadgePlacements(
  players: Array<
    | string
    | {
        label: string
        number?: string
        formationField?: string | null
        formationPosition?: number | null
      }
  >,
): LineupBadgePlacement[] {
  const parsed = parseLineupPlayers(players)
  const positioned = parsed.filter((p) => p.row != null && p.col != null)

  if (positioned.length < 4) {
    return parsed.map((p, i) => fallbackPlacement(i, p))
  }

  const rows = [...new Set(positioned.map((p) => p.row as number))].sort((a, b) => a - b)
  const gk = positioned.find((p) => p.formationPosition === 1)
  const invert = gk ? (gk.row as number) <= Math.min(...rows) : true
  const rowIndexByValue = new Map(rows.map((v, i) => [v, i] as const))
  const rowCount = Math.max(1, rows.length - 1)

  const placements: LineupBadgePlacement[] = parsed.map((p, i) => {
    if (p.row == null || p.col == null) {
      return fallbackPlacement(i, p)
    }

    const rowPlayers = positioned
      .filter((x) => x.row === p.row)
      .sort((a, b) => (a.col as number) - (b.col as number) || a.index - b.index)
    const slot = Math.max(0, rowPlayers.findIndex((x) => x === p))
    const xs = horizontalForRow(rowPlayers)
    const rowIdx = rowIndexByValue.get(p.row) ?? 0
    const normalized = rowIdx / rowCount
    const y = invert ? 88 - normalized * 78 : 10 + normalized * 78
    const n = rowPlayers.length
    const maxWidthPct = Math.min(28, Math.max(14, Math.floor(78 / n)))

    return {
      name: p.name,
      number: p.number,
      left: xs[slot] ?? 50,
      top: clampPct(y, 8, 90),
      maxWidthPct,
    }
  })

  const byRow = new Map<number, LineupBadgePlacement[]>()
  for (let idx = 0; idx < parsed.length; idx++) {
    const p = parsed[idx]
    if (p.row == null) continue
    const placement = placements[idx]
    if (!placement) continue
    const list = byRow.get(p.row) ?? []
    list.push(placement)
    byRow.set(p.row, list)
  }
  for (const row of byRow.values()) {
    resolveRowOverlaps(row)
  }

  return placements
}
