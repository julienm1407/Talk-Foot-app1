import type { ClubSquadNode } from '../../data/clubPageMock'

export type SmSquadPlayerRow = {
  playerSmId: number
  label: string
  number: string
  position?: string
}

function playerDisplayName(p: Record<string, unknown>): string {
  const dn = String(p.display_name ?? '').trim()
  if (dn) return dn
  const n = String(p.name ?? '').trim()
  if (n) return n
  const fn = String(p.firstname ?? '').trim()
  const ln = String(p.lastname ?? '').trim()
  const full = `${fn} ${ln}`.trim()
  return full || '—'
}

function positionLabel(p: Record<string, unknown>): string | undefined {
  const pos = p.position
  if (!pos || typeof pos !== 'object') return undefined
  const o = pos as { name?: string; developer_name?: string }
  return String(o.name ?? o.developer_name ?? '').trim() || undefined
}

function jerseyFromRow(row: Record<string, unknown>, player: Record<string, unknown>): string {
  for (const k of ['jersey_number', 'number', 'shirt_number']) {
    const v = row[k] ?? player[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return '?'
}

function jerseySortKey(n: string): number {
  const x = parseInt(n, 10)
  return Number.isFinite(x) ? x : 999
}

/**
 * Joueurs du effectif depuis la réponse `squads/teams/{id}` (`data[]` avec `player`).
 */
export function extractSquadPlayersFromSmEnvelope(envelope: { data?: unknown }): SmSquadPlayerRow[] {
  const data = envelope.data
  if (!Array.isArray(data)) return []

  const out: SmSquadPlayerRow[] = []
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const player = row.player
    if (!player || typeof player !== 'object') continue
    const p = player as Record<string, unknown>
    const id = p.id
    if (typeof id !== 'number' || !Number.isFinite(id)) continue
    const label = playerDisplayName(p)
    if (!label || label === '—') continue
    out.push({
      playerSmId: id,
      label,
      number: jerseyFromRow(row, p),
      position: positionLabel(p),
    })
  }

  out.sort((a, b) => {
    const ja = jerseySortKey(a.number)
    const jb = jerseySortKey(b.number)
    if (ja !== jb) return ja - jb
    return a.label.localeCompare(b.label, 'fr')
  })
  return out
}

/** Superpose les noms / numéros SM sur les 11 nœuds du terrain (ordre maillot). */
export function overlayClubSquadWithSmPlayers(
  baseSquad: ClubSquadNode[],
  smPlayers: SmSquadPlayerRow[],
): ClubSquadNode[] {
  if (!baseSquad.length || !smPlayers.length) return baseSquad
  const sorted = [...smPlayers]
  return baseSquad.map((node, i) => {
    const p = sorted[i]
    if (!p) return node
    return { ...node, label: p.label, number: p.number }
  })
}
