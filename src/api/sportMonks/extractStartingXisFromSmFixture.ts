import type { SmFixture, SmLineupRow } from './types'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type SmStartingXiPlayer = {
  label: string
  number?: string
  playerId?: number
  formationField?: string
  formationPosition?: number
  /** Photo joueur SportMonks (`player.image_path`) quand disponible. */
  photoUrl?: string
}

export type SmStartingXIs = { home: SmStartingXiPlayer[]; away: SmStartingXiPlayer[] }

/** D’où viennent les onzes affichés (SportMonks). */
export type SmLineupSource = 'confirmed' | 'probable' | 'estimated' | 'unknown'

export type SmMatchLineupBundle = {
  starters: SmStartingXIs | null
  formations: { home?: string; away?: string }
  source: SmLineupSource
}

function playerLabel(row: SmLineupRow): string | null {
  const p = row.player
  if (!p) return null
  const dn = String(p.display_name ?? '').trim()
  if (dn) return dn
  const n = String(p.name ?? '').trim()
  if (n) return n
  const fn = String(p.firstname ?? '').trim()
  const ln = String(p.lastname ?? '').trim()
  const full = `${fn} ${ln}`.trim()
  return full || null
}

function jerseyNumber(row: SmLineupRow): number {
  const direct = row.jersey_number
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct
  const details = row.details
  if (!Array.isArray(details)) return 999
  for (const d of details) {
    const dev = `${d.type?.developer_name ?? ''} ${d.type?.name ?? ''}`.toUpperCase()
    if (dev.includes('NUMBER') || dev.includes('JERSEY') || dev.includes('SHIRT')) {
      const n = Number(d.value)
      if (Number.isFinite(n)) return n
    }
  }
  return 999
}

function hasFormationField(row: SmLineupRow): boolean {
  const ff = row.formation_field
  return ff != null && String(ff).trim() !== ''
}

function isBenchRow(row: SmLineupRow): boolean {
  const t = `${row.type?.developer_name ?? ''} ${row.type?.name ?? ''}`.toUpperCase()
  if (t.includes('BENCH') || t.includes('SUBSTITUTE') || t.includes('REPLACEMENT')) return true
  /** SM foot : banc souvent `type_id` 12 (évite d’exclure un titulaire si `formation_field` est déjà renseigné). */
  if (row.type_id === 12 && !hasFormationField(row)) return true
  return false
}

function lineupTypeBucket(row: SmLineupRow): 'confirmed' | 'probable' | 'other' {
  const t = `${row.type?.developer_name ?? ''} ${row.type?.name ?? ''}`.toUpperCase()
  if (t.includes('EXPECTED') || t.includes('PROBABLE') || t.includes('PREDICT') || t.includes('PROVISIONAL'))
    return 'probable'
  if (
    t.includes('CONFIRM') ||
    t.includes('STARTING XI') ||
    (t.includes('STARTING') && !t.includes('SUBSTITUTE'))
  )
    return 'confirmed'
  return 'other'
}

function teamIdOf(row: SmLineupRow): number | null {
  const raw = row.team_id
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number(raw.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

function partitionLineups(rows: SmLineupRow[], homeId: number, awayId: number) {
  const home: SmLineupRow[] = []
  const away: SmLineupRow[] = []
  for (const r of rows) {
    const tid = teamIdOf(r)
    if (tid === homeId) home.push(r)
    else if (tid === awayId) away.push(r)
  }
  return { home, away }
}

function formationSortKey(row: SmLineupRow): number {
  const fp = row.formation_position
  if (typeof fp === 'number' && Number.isFinite(fp)) return fp
  const ff = row.formation_field
  if (ff && typeof ff === 'string') {
    const [a, b] = ff.split(':').map((x) => Number(x.trim()))
    if (Number.isFinite(a) && Number.isFinite(b)) return a * 10 + b
  }
  return 999
}

function playerPhotoUrl(row: SmLineupRow): string | undefined {
  const p = row.player
  const raw = p && typeof p === 'object' ? (p as { image_path?: string | null }).image_path : undefined
  const url = typeof raw === 'string' ? raw.trim() : ''
  return url || undefined
}

function takeXiFromRows(rows: SmLineupRow[]): SmStartingXiPlayer[] {
  const nonBench = rows.filter((r) => !isBenchRow(r))
  const pool = nonBench.length ? nonBench : rows
  const items: Array<{
    label: string
    j: number
    fk: number
    playerId?: number
    formationField?: string
    formationPosition?: number
    photoUrl?: string
  }> = []
  for (const r of pool) {
    const label = playerLabel(r)
    if (!label) continue
    const j = jerseyNumber(r)
    const fk = formationSortKey(r)
    const playerId =
      typeof r.player_id === 'number'
        ? r.player_id
        : typeof r.player?.id === 'number'
          ? r.player.id
          : undefined
    const formationField =
      typeof r.formation_field === 'string' && r.formation_field.trim() ? r.formation_field.trim() : undefined
    const formationPosition =
      typeof r.formation_position === 'number' && Number.isFinite(r.formation_position)
        ? r.formation_position
        : undefined
    const photoUrl = playerPhotoUrl(r)
    items.push({ label, j, fk, playerId, formationField, formationPosition, photoUrl })
  }
  items.sort((a, b) => (a.fk !== b.fk ? a.fk - b.fk : a.j - b.j))
  return items.slice(0, 11).map(({ label, j, playerId, formationField, formationPosition, photoUrl }) => ({
    label,
    number: j < 100 ? String(j) : undefined,
    playerId,
    formationField,
    formationPosition,
    photoUrl,
  }))
}

/** Choisit le meilleur sous-ensemble de lignes lineup pour un côté (officiel terrain > probable > reste). */
function pickSidePool(side: SmLineupRow[]): { rows: SmLineupRow[]; source: SmLineupSource } {
  const nonBench = side.filter((r) => !isBenchRow(r))
  if (!nonBench.length) return { rows: [], source: 'unknown' }

  const onField = nonBench.filter((r) => hasFormationField(r))
  if (onField.length >= 7) {
    return { rows: onField, source: 'confirmed' }
  }

  const probable = nonBench.filter((r) => lineupTypeBucket(r) === 'probable')
  if (probable.length >= 7) {
    return { rows: probable, source: 'probable' }
  }

  const confirmedType = nonBench.filter((r) => lineupTypeBucket(r) === 'confirmed')
  if (confirmedType.length >= 7) {
    return { rows: confirmedType, source: 'confirmed' }
  }

  if (probable.length > 0) {
    return { rows: probable, source: 'probable' }
  }
  if (confirmedType.length > 0) {
    return { rows: confirmedType, source: 'confirmed' }
  }

  if (onField.length > 0) {
    return { rows: onField, source: 'confirmed' }
  }

  return { rows: nonBench, source: 'estimated' }
}

function mergeSource(a: SmLineupSource, b: SmLineupSource): SmLineupSource {
  const rank = (s: SmLineupSource) =>
    s === 'confirmed' ? 3 : s === 'probable' ? 2 : s === 'estimated' ? 1 : 0
  return rank(a) >= rank(b) ? a : b
}

function extractFormations(fixture: SmFixture, homeId: number, awayId: number): { home?: string; away?: string } {
  const rows = fixture.formations
  if (!Array.isArray(rows)) return {}
  const out: { home?: string; away?: string } = {}
  for (const r of rows) {
    const f = String(r.formation ?? '').trim()
    if (!f) continue
    const loc = String(r.location ?? '').toLowerCase()
    if (loc === 'home') {
      out.home = f
      continue
    }
    if (loc === 'away') {
      out.away = f
      continue
    }
    const pid = r.participant_id
    if (pid != null && pid === homeId) out.home = f
    else if (pid != null && pid === awayId) out.away = f
  }
  return out
}

/**
 * Onzes + systèmes depuis `lineups` / `formations` (include SM aligné sur
 * `participants;…;lineups.*;metadata.type;coaches;formations`).
 */
export function extractMatchLineupBundleFromFixture(
  fixture: SmFixture | null | undefined,
): SmMatchLineupBundle | null {
  if (!fixture) return null
  const rows = fixture.lineups
  if (!Array.isArray(rows) || !rows.length) {
    const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
    if (homeId == null || awayId == null) return null
    const formations = extractFormations(fixture, homeId, awayId)
    if (!formations.home && !formations.away) return null
    return { starters: null, formations, source: 'unknown' }
  }

  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  if (homeId == null || awayId == null) return null

  const { home, away } = partitionLineups(rows, homeId, awayId)
  const ph = pickSidePool(home)
  const pa = pickSidePool(away)
  const hx = takeXiFromRows(ph.rows)
  const ax = takeXiFromRows(pa.rows)
  const formations = extractFormations(fixture, homeId, awayId)

  if (!hx.length && !ax.length) {
    if (!formations.home && !formations.away) return null
    return { starters: null, formations, source: 'unknown' }
  }

  const source =
    hx.length && ax.length
      ? mergeSource(ph.source, pa.source)
      : hx.length
        ? ph.source
        : ax.length
          ? pa.source
          : 'unknown'
  return {
    starters: { home: hx, away: ax },
    formations,
    source,
  }
}

/**
 * Onze de départ par équipe (rétrocompat) — préfère la même logique que la tribune avant-match.
 */
export function extractStartingXisFromFixture(fixture: SmFixture | null | undefined): SmStartingXIs | null {
  return extractMatchLineupBundleFromFixture(fixture)?.starters ?? null
}
