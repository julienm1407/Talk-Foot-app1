type ParsedPlayer = {
  name: string
  number?: string
  row: number
  col: number
  formationPosition?: number | null
}

export type LineupPitchRow = {
  row: number
  topPct: number
  players: Array<{ name: string; number?: string; col: number }>
}

export type LineupPitchLayout = {
  rows: LineupPitchRow[]
  /** Liste complète triée (numéro puis nom) pour affichage sous le terrain. */
  roster: Array<{ name: string; number?: string }>
}

function parseFormationLines(formation?: string | null): number[] {
  const raw = String(formation ?? '').trim()
  if (!raw) return [1, 4, 4, 2]
  const parts = raw
    .split(/[-/|\s]+/)
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!parts.length) return [1, 4, 4, 2]
  return [1, ...parts]
}

function inferRowColFromFormationPosition(fp: number, lines: number[]): { row: number; col: number } {
  const pos = Math.max(1, Math.min(11, Math.round(fp)))
  let remaining = pos
  for (let i = 0; i < lines.length; i++) {
    if (remaining <= lines[i]) {
      return { row: i + 1, col: remaining }
    }
    remaining -= lines[i]
  }
  return { row: lines.length, col: 1 }
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
  formation?: string | null,
): ParsedPlayer[] {
  const lines = parseFormationLines(formation)

  return players
    .slice(0, 11)
    .map((p, index) => {
      if (typeof p === 'string') {
        const { row, col } = inferRowColFromFormationPosition(index + 1, lines)
        return { name: p, row, col, formationPosition: index + 1 }
      }

      const ff = p.formationField?.trim()
      if (ff) {
        const [rowRaw, colRaw] = ff.split(':').map((x) => Number(x.trim()))
        if (Number.isFinite(rowRaw) && Number.isFinite(colRaw) && rowRaw > 0 && colRaw > 0) {
          return {
            name: p.label,
            number: p.number,
            row: rowRaw,
            col: colRaw,
            formationPosition: p.formationPosition,
          }
        }
      }

      const fp = p.formationPosition ?? index + 1
      const { row, col } = inferRowColFromFormationPosition(fp, lines)
      return {
        name: p.label,
        number: p.number,
        row,
        col,
        formationPosition: fp,
      }
    })
    .filter((p) => p.name.trim().length > 0)
}

function surnameLabel(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Joueur'
  const parts = cleaned.split(' ')
  const last = parts[parts.length - 1] ?? cleaned
  return last.length >= 2 ? last : cleaned
}

/**
 * Ligne tactique par bande horizontale (flex) — évite le chevauchement des badges absolus.
 */
export function computeLineupPitchLayout(
  players: Array<
    | string
    | {
        label: string
        number?: string
        formationField?: string | null
        formationPosition?: number | null
      }
  >,
  formation?: string | null,
): LineupPitchLayout {
  const parsed = parseLineupPlayers(players, formation)
  if (!parsed.length) return { rows: [], roster: [] }

  const rowKeys = [...new Set(parsed.map((p) => p.row))].sort((a, b) => a - b)
  const rowCount = Math.max(1, rowKeys.length - 1)

  const rows: LineupPitchRow[] = rowKeys.map((rowKey, idx) => {
    const rowPlayers = parsed
      .filter((p) => p.row === rowKey)
      .sort((a, b) => a.col - b.col || a.name.localeCompare(b.name))
    const topPct = rowCount === 0 ? 50 : 92 - (idx / rowCount) * 82
    return {
      row: rowKey,
      topPct,
      players: rowPlayers.map((p) => ({
        name: surnameLabel(p.name),
        number: p.number,
        col: p.col,
      })),
    }
  })

  const roster = [...parsed]
    .sort((a, b) => {
      const na = Number(a.number)
      const nb = Number(b.number)
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
      if (Number.isFinite(na) && !Number.isFinite(nb)) return -1
      if (!Number.isFinite(na) && Number.isFinite(nb)) return 1
      return a.name.localeCompare(b.name, 'fr')
    })
    .map((p) => ({ name: p.name, number: p.number }))

  return { rows, roster }
}

/** @deprecated Utiliser computeLineupPitchLayout */
export type LineupBadgePlacement = {
  name: string
  number?: string
  left: number
  top: number
  maxWidthPct: number
}

/** @deprecated Utiliser computeLineupPitchLayout */
export function computeLineupBadgePlacements(
  players: Parameters<typeof computeLineupPitchLayout>[0],
  formation?: string | null,
): LineupBadgePlacement[] {
  const { rows } = computeLineupPitchLayout(players, formation)
  const out: LineupBadgePlacement[] = []
  for (const row of rows) {
    const n = row.players.length
    for (let i = 0; i < n; i++) {
      const p = row.players[i]
      const left = n <= 1 ? 50 : 8 + (i / (n - 1)) * 84
      out.push({
        name: p.name,
        number: p.number,
        left,
        top: row.topPct,
        maxWidthPct: Math.min(22, Math.floor(80 / Math.max(1, n))),
      })
    }
  }
  return out
}

export const LINEUP_FALLBACK_POSITIONS: Array<{ left: number; top: number }> = []
