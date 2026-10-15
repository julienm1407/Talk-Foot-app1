import type { SmFixture } from './types'
import { normalizeSmFixtureIncludes } from './normalizeSmFixtureIncludes'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type SidelinedCounts = { home: number; away: number }

export type SidelinedPlayer = {
  playerId?: number
  name: string
  shortName: string
  photoUrl?: string
  reason: string
  kind: 'injury' | 'suspension' | 'doubt' | 'other'
}

export type SidelinedPlayersBySide = { home: SidelinedPlayer[]; away: SidelinedPlayer[] }

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function playerNameFrom(obj: Record<string, unknown> | null): string {
  if (!obj) return ''
  const dn = String(obj.display_name ?? '').trim()
  if (dn) return dn
  const n = String(obj.name ?? '').trim()
  if (n) return n
  const fn = String(obj.firstname ?? '').trim()
  const ln = String(obj.lastname ?? '').trim()
  return `${fn} ${ln}`.trim()
}

function shortNameFrom(full: string): string {
  const parts = full.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (parts.length <= 1) return full
  return parts[parts.length - 1] ?? full
}

function typeBlob(row: Record<string, unknown>): string {
  const sideline = rec(row.sideline)
  const nestedType = rec(sideline?.type)
  const topType = rec(row.type)
  return [
    nestedType?.name,
    nestedType?.developer_name,
    nestedType?.code,
    sideline?.category,
    sideline?.reason,
    topType?.name,
    topType?.developer_name,
    row.type,
    row.category,
    row.reason,
  ]
    .map((x) => (x == null ? '' : String(x)))
    .join(' ')
}

export function classifySidelineKind(raw: string): SidelinedPlayer['kind'] {
  const t = raw.toLowerCase()
  if (t.includes('susp') || t.includes('ban') || t.includes('red') || t.includes('carto') || t.includes('exclu')) {
    return 'suspension'
  }
  if (t.includes('doubt') || t.includes('incert')) return 'doubt'
  if (
    t.includes('injur') ||
    t.includes('bless') ||
    t.includes('ill') ||
    t.includes('maladie') ||
    t.includes('knock') ||
    t.includes('hamstring') ||
    t.includes('knee') ||
    t.includes('ankle') ||
    t.includes('muscle')
  ) {
    return 'injury'
  }
  return 'other'
}

export function translateSidelineReasonFr(raw: string): string {
  const t = raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return 'Absent'
  const lower = t.toLowerCase()
  const rules: Array<[RegExp, string]> = [
    [/red card|expulsion|sent off/, 'Expulsion'],
    [/yellow.*susp|accumulation/, 'Suspension (cartons)'],
    [/suspen|ban\b/, 'Suspension'],
    [/doubt|incert/, 'Incertain'],
    [/illness|ill\b|sick|maladie/, 'Maladie'],
    [/hamstring|ischio/, 'Ischio-jambiers'],
    [/acl|cruciate|croisé/, 'Ligament croisé'],
    [/knee|genou/, 'Genou'],
    [/ankle|cheville/, 'Cheville'],
    [/calf|mollet/, 'Mollet'],
    [/thigh|cuisse/, 'Cuisse'],
    [/groin|adduct/, 'Adducteurs'],
    [/muscle|muscul/, 'Musculaire'],
    [/knock|coup\b/, 'Coup'],
    [/international|selection|sélection/, 'Sélection'],
    [/personal|personnel/, 'Raison personnelle'],
    [/rest|repos/, 'Repos'],
    [/injur|bless/, 'Blessure'],
  ]
  for (const [re, fr] of rules) {
    if (re.test(lower)) return fr
  }
  if (/^[A-Z][A-Z0-9_ ]+$/.test(t)) {
    const pretty = t
      .toLowerCase()
      .split(/[\s_]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    return pretty || 'Absent'
  }
  return t
}

function teamIdOf(row: Record<string, unknown>): number | null {
  const n = Number(row.team_id ?? row.participant_id ?? rec(row.participant)?.id)
  return Number.isFinite(n) ? n : null
}

function parseRow(item: unknown): {
  teamId: number | null
  player: SidelinedPlayer | null
  rawType: string
} {
  const row = rec(item)
  if (!row) return { teamId: null, player: null, rawType: '' }
  const sideline = rec(row.sideline)
  const playerObj =
    rec(row.player) ?? rec(sideline?.player) ?? rec(rec(sideline?.player)?.data) ?? rec(rec(row.player)?.data)
  const name = playerNameFrom(playerObj)
  const rawType = typeBlob(row)
  const kind = classifySidelineKind(rawType)
  if (!name) return { teamId: teamIdOf(row), player: null, rawType }

  const photo = String(playerObj?.image_path ?? '').trim()
  const playerIdRaw = Number(row.player_id ?? playerObj?.id ?? sideline?.player_id)
  const label = name || 'Joueur'
  return {
    teamId: teamIdOf(row),
    rawType,
    player: {
      playerId: Number.isFinite(playerIdRaw) ? playerIdRaw : undefined,
      name: label,
      shortName: shortNameFrom(label),
      photoUrl: photo || undefined,
      reason: translateSidelineReasonFr(rawType),
      kind,
    },
  }
}

export function extractSidelinedPlayersFromSmFixture(
  fixture: SmFixture | null | undefined,
): SidelinedPlayersBySide {
  const empty: SidelinedPlayersBySide = { home: [], away: [] }
  if (!fixture) return empty
  const fx = normalizeSmFixtureIncludes(fixture) ?? fixture
  const sides = smFixtureHomeAwayParticipantIds(fx)
  if (sides.homeId == null || sides.awayId == null) return empty
  const list = Array.isArray(fx.sidelined) ? fx.sidelined : []
  const home: SidelinedPlayer[] = []
  const away: SidelinedPlayer[] = []
  const seen = new Set<string>()

  for (const item of list) {
    const parsed = parseRow(item)
    if (!parsed.player) continue
    const key = `${parsed.teamId}:${parsed.player.playerId ?? parsed.player.name}`
    if (seen.has(key)) continue
    seen.add(key)
    if (parsed.teamId === sides.homeId) home.push(parsed.player)
    else if (parsed.teamId === sides.awayId) away.push(parsed.player)
  }

  return { home, away }
}

/**
 * Compte les absences importantes (blessure / suspension) par camp — plafonné pour les cotes.
 */
export function extractSidelinedCountsFromSmFixture(fixture: SmFixture | null | undefined): SidelinedCounts {
  const { home, away } = extractSidelinedPlayersFromSmFixture(fixture)
  const countSide = (rows: SidelinedPlayer[]) =>
    Math.min(
      rows.filter((p) => p.kind === 'injury' || p.kind === 'suspension' || p.kind === 'doubt').length,
      6,
    )
  return { home: countSide(home), away: countSide(away) }
}
