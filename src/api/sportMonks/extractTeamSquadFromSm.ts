import {
  CLUB_PITCH_433_LAYOUT,
  defaultClubPitchFormation,
  type ClubSquadNode,
} from '../../data/clubPageMock'

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

function roleFromSmPosition(pos: string | undefined): 'gk' | 'def' | 'mid' | 'att' | 'unknown' {
  const s = (pos ?? '').toLowerCase()
  if (!s) return 'unknown'
  if (/goal|gardien|keeper|^gk\b/.test(s)) return 'gk'
  if (/defen|arrière|back|centre.?back|^cb\b|^lb\b|^rb\b/.test(s)) return 'def'
  if (/mid|milieu|wing.?back|^cm\b|^dm\b|^am\b/.test(s)) return 'mid'
  if (/attack|forward|striker|ailier|winger|^st\b|^cf\b|^lw\b|^rw\b/.test(s)) return 'att'
  return 'unknown'
}

/** Ordonne l’effectif pour coller au 4-3-3 (ATT → MID → DEF → GK sur le layout). */
function orderPlayersForPitch(smPlayers: SmSquadPlayerRow[]): SmSquadPlayerRow[] {
  const buckets: Record<'gk' | 'def' | 'mid' | 'att' | 'unknown', SmSquadPlayerRow[]> = {
    gk: [],
    def: [],
    mid: [],
    att: [],
    unknown: [],
  }
  for (const p of smPlayers) {
    buckets[roleFromSmPosition(p.position)].push(p)
  }
  for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
    buckets[key].sort((a, b) => {
      const ja = jerseySortKey(a.number)
      const jb = jerseySortKey(b.number)
      if (ja !== jb) return ja - jb
      return a.label.localeCompare(b.label, 'fr')
    })
  }

  const needs = CLUB_PITCH_433_LAYOUT.map((slot) => slot.role as 'gk' | 'def' | 'mid' | 'att')
  const picked: SmSquadPlayerRow[] = []
  const used = new Set<number>()

  const take = (role: 'gk' | 'def' | 'mid' | 'att' | 'unknown') => {
    const next = buckets[role].find((p) => !used.has(p.playerSmId))
    if (!next) return null
    used.add(next.playerSmId)
    return next
  }

  for (const role of needs) {
    const hit =
      take(role) ??
      take('unknown') ??
      take('att') ??
      take('mid') ??
      take('def') ??
      take('gk')
    if (hit) picked.push(hit)
  }

  while (picked.length < 11) {
    const rest = smPlayers.find((p) => !used.has(p.playerSmId))
    if (!rest) break
    used.add(rest.playerSmId)
    picked.push(rest)
  }
  return picked
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

/** Superpose les noms / numéros SM sur les 11 nœuds du terrain (formation 4-3-3). */
export function overlayClubSquadWithSmPlayers(
  baseSquad: ClubSquadNode[],
  smPlayers: SmSquadPlayerRow[],
  pfx = 'club',
): ClubSquadNode[] {
  const base = baseSquad.length >= 11 ? baseSquad.slice(0, 11) : defaultClubPitchFormation(pfx)
  if (!smPlayers.length) return base
  const ordered = orderPlayersForPitch(smPlayers)
  return base.map((node, i) => {
    const p = ordered[i]
    if (!p) return node
    return { ...node, label: p.label, number: p.number }
  })
}
