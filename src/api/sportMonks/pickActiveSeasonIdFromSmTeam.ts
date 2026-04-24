/**
 * Extrait l’id **saison** SportMonks depuis `GET /teams/{id}?include=activeSeasons`.
 * Préfère une saison marquée courante, sinon la première entrée.
 */
export function pickActiveSeasonIdFromSmTeamPayload(payload: unknown): number | undefined {
  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload
  if (!data || typeof data !== 'object') return undefined

  const d = data as { activeSeasons?: unknown; seasons?: unknown }
  const active = d.activeSeasons
  const seasons = d.seasons
  const list: unknown[] = Array.isArray(active)
    ? active
    : Array.isArray(seasons)
      ? seasons
      : []
  if (!list.length) return undefined

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const cur = o.is_current ?? o.isCurrent
    if (cur === true || cur === 1 || cur === '1') {
      const id = o.id
      if (typeof id === 'number' && Number.isFinite(id) && id > 0) return Math.floor(id)
    }
  }

  const first = list[0]
  if (first && typeof first === 'object') {
    const id = (first as Record<string, unknown>).id
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) return Math.floor(id)
  }
  return undefined
}
