import type { SmFixture, SmLeague } from './types'

export type LeaguesDateDaySummary = {
  /** Nombre d’entrées ligue dans `data`. */
  leagueCount: number
  /** Nombre de lignes `today` (matchs / créneaux) sommées sur toutes les ligues. */
  scheduledSlots: number
  /** Quelques noms de compétitions pour l’aperçu. */
  sampleLeagueNames: string[]
  /**
   * Chaînes TV dont le pays diffuseur est la France (`tvstations.country` ou `tvstation.country`),
   * uniques, ordre d’apparition dans la réponse.
   */
  frenchTvStations: string[]
}

function todayLength(today: unknown): number {
  if (Array.isArray(today)) return today.length
  return 0
}

function countryIsFrance(country: unknown): boolean {
  if (!country || typeof country !== 'object') return false
  const c = country as Record<string, unknown>
  const iso2 = String(c.iso2 ?? c.iso_2 ?? '').trim().toUpperCase()
  if (iso2 === 'FR') return true
  const iso3 = String(c.iso3 ?? c.iso_3 ?? '').trim().toUpperCase()
  if (iso3 === 'FRA') return true
  const name = String(c.name ?? '').trim().toLowerCase()
  return name === 'france'
}

function tvStationLinkIsFrenchBroadcast(link: Record<string, unknown>): boolean {
  if (countryIsFrance(link.country)) return true
  const ts = link.tvstation ?? link.tv_station ?? link.Tvstation
  if (ts && typeof ts === 'object') {
    const o = ts as Record<string, unknown>
    if (countryIsFrance(o.country)) return true
  }
  return false
}

function tvStationNameFromLink(link: Record<string, unknown>): string | null {
  const ts = link.tvstation ?? link.tv_station ?? link.Tvstation
  if (!ts || typeof ts !== 'object') return null
  const o = ts as Record<string, unknown>
  const n = String(o.name ?? o.title ?? '').trim()
  return n || null
}

function fixtureTvLinks(fixture: Record<string, unknown>): unknown[] {
  const a = fixture.tvstations ?? fixture.tv_stations ?? fixture.Tvstations
  return Array.isArray(a) ? a : []
}

/** Lignes `data[]` d’une réponse `GET /leagues/date/{YYYY-MM-DD}`. */
export function leaguesDateResponseDataRows(body: unknown): unknown[] {
  const raw = body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') return [raw]
  return []
}

function leagueShapeFromRow(leagueRow: Record<string, unknown>): SmLeague | undefined {
  const nested = leagueRow.league
  if (nested && typeof nested === 'object') {
    const L = nested as SmLeague
    if (L.id != null || L.name) return L
  }
  const id = leagueRow.id
  const name = leagueRow.name
  if (typeof name === 'string' && name.trim()) {
    return {
      id: typeof id === 'number' ? id : undefined,
      name: name.trim(),
      short_code: typeof leagueRow.short_code === 'string' ? leagueRow.short_code : undefined,
    }
  }
  return undefined
}

/**
 * Aplatit les fixtures du jour (`data[].today[]`) en `SmFixture[]`, avec `league` héritée de la ligne ligue si absente.
 */
export function smFixturesFromLeaguesDateEnvelope(body: unknown): SmFixture[] {
  const list = leaguesDateResponseDataRows(body)
  const out: SmFixture[] = []

  for (const row of list) {
    if (!row || typeof row !== 'object') continue
    const leagueRow = row as Record<string, unknown>
    const today = leagueRow.today
    if (!Array.isArray(today)) continue
    const parentLeague = leagueShapeFromRow(leagueRow)

    for (const rawFx of today) {
      if (!rawFx || typeof rawFx !== 'object') continue
      const fx = rawFx as Partial<SmFixture> & { id?: unknown }
      if (typeof fx.id !== 'number' || !Number.isFinite(fx.id)) continue
      const merged: SmFixture = {
        ...(fx as SmFixture),
        league: fx.league ?? parentLeague,
        league_id: fx.league_id ?? parentLeague?.id,
      }
      out.push(merged)
    }
  }

  return out
}

/** Collecte les noms de chaînes listées comme diffusées en France pour ce jour. */
export function collectFrenchTvStationNamesFromLeaguesDateList(list: unknown[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const leagueRow of list) {
    if (!leagueRow || typeof leagueRow !== 'object') continue
    const today = (leagueRow as Record<string, unknown>).today
    if (!Array.isArray(today)) continue

    for (const fx of today) {
      if (!fx || typeof fx !== 'object') continue
      for (const rawLink of fixtureTvLinks(fx as Record<string, unknown>)) {
        if (!rawLink || typeof rawLink !== 'object') continue
        const link = rawLink as Record<string, unknown>
        if (!tvStationLinkIsFrenchBroadcast(link)) continue
        const label = tvStationNameFromLink(link)
        if (!label) continue
        const key = label.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(label)
      }
    }
  }

  return out
}

/**
 * Résume la réponse `GET /leagues/date/{YYYY-MM-DD}?include=today.*…;country`
 * (structure `data[]` avec `today` par ligue).
 */
export function summarizeLeaguesDateEnvelope(body: unknown): LeaguesDateDaySummary | null {
  const list = leaguesDateResponseDataRows(body)
  if (!list.length) return null

  let scheduledSlots = 0
  const sampleLeagueNames: string[] = []

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const nestedLeague = row.league && typeof row.league === 'object' ? (row.league as Record<string, unknown>) : null
    const name =
      (typeof row.name === 'string' && row.name.trim()) ||
      (typeof row.short_name === 'string' && row.short_name.trim()) ||
      (nestedLeague && typeof nestedLeague.name === 'string' && nestedLeague.name.trim()) ||
      null
    if (name) sampleLeagueNames.push(name)

    scheduledSlots += todayLength(row.today)
  }

  const frenchTvStations = collectFrenchTvStationNamesFromLeaguesDateList(list)

  return {
    leagueCount: list.length,
    scheduledSlots,
    sampleLeagueNames: sampleLeagueNames.slice(0, 8),
    frenchTvStations,
  }
}
