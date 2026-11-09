import { smIncludeRows } from './normalizeSmFixtureIncludes'
import { SM_TOPSCORER_TYPE_GOALS } from './includes'

export type SeasonTopscorerRow = {
  rank: number
  playerId: number
  name: string
  photoUrl?: string
  team: string
  teamLogo?: string
  goals: number
  nationality?: string
  position?: string
}

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function unwrap(v: unknown): Record<string, unknown> | null {
  const o = rec(v)
  if (!o) return null
  return rec(o.data) ?? o
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const nested = rec(v)
  if (nested) return num(nested.value ?? nested.total ?? nested.goals)
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: unknown): string | undefined {
  const s = String(v ?? '').trim()
  return s || undefined
}

function named(v: unknown): string | undefined {
  const o = unwrap(v)
  return str(o?.display_name) ?? str(o?.name) ?? str(o?.common_name)
}

function typeId(row: Record<string, unknown>): number | null {
  const t = unwrap(row.type)
  return num(row.type_id ?? t?.id)
}

function typeLooksLikeGoals(row: Record<string, unknown>): boolean {
  const id = typeId(row)
  if (id === SM_TOPSCORER_TYPE_GOALS) return true
  const t = unwrap(row.type)
  const blob = `${t?.developer_name ?? ''} ${t?.name ?? ''}`.toUpperCase()
  return blob.includes('GOAL') && !blob.includes('ASSIST') && !blob.includes('CONCEDED')
}

/**
 * Liste des buteurs depuis `GET /topscorers/seasons/{id}` (filtre type 208).
 */
export function extractSeasonTopscorersFromSmPayload(payload: unknown): SeasonTopscorerRow[] {
  const root = rec(payload)
  const rows = smIncludeRows<Record<string, unknown>>(root?.data ?? payload)
  const out: SeasonTopscorerRow[] = []

  for (const raw of rows) {
    const row = rec(raw)
    if (!row) continue
    if (!typeLooksLikeGoals(row) && typeId(row) != null) continue

    const player = unwrap(row.player)
    const playerId = num(row.player_id ?? player?.id)
    const name =
      named(player) ??
      `${str(player?.firstname) ?? ''} ${str(player?.lastname) ?? ''}`.trim()
    if (playerId == null || playerId <= 0 || !name) continue

    const goals =
      num(row.total) ??
      num(row.goals) ??
      num(row.value) ??
      num(rec(row.data)?.value) ??
      0
    if (goals < 0) continue

    const team = unwrap(row.participant) ?? unwrap(row.team)
    out.push({
      rank: num(row.position ?? row.ranking ?? row.place) ?? 0,
      playerId,
      name,
      photoUrl: str(player?.image_path),
      team: named(team) ?? '—',
      teamLogo: str(team?.image_path),
      goals,
      nationality: named(player?.nationality),
      position: named(player?.position) ?? named(player?.detailedPosition),
    })
  }

  out.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'fr'))
  return out.map((r, i) => ({ ...r, rank: i + 1 }))
}
