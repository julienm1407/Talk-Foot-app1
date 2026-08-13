export type SmLeagueSeasonPick = {
  seasonId: number
  seasonName?: string
  seasonStartsAt?: string
  seasonEndsAt?: string
}

function readSeasonFields(raw: unknown): SmLeagueSeasonPick | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const id = o.id
  if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) return undefined
  const name = typeof o.name === 'string' ? o.name.trim() : undefined
  const seasonStartsAt =
    typeof o.starting_at === 'string'
      ? o.starting_at
      : typeof o.startingAt === 'string'
        ? o.startingAt
        : undefined
  const seasonEndsAt =
    typeof o.ending_at === 'string'
      ? o.ending_at
      : typeof o.endingAt === 'string'
        ? o.endingAt
        : undefined
  return {
    seasonId: Math.floor(id),
    ...(name ? { seasonName: name } : {}),
    ...(seasonStartsAt ? { seasonStartsAt } : {}),
    ...(seasonEndsAt ? { seasonEndsAt } : {}),
  }
}

function ymdFromDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Choisit la saison SportMonks pour `standings/seasons/{id}` quand le live est vide.
 * Préfère la saison courante SM, sinon la prochaine à venir, sinon la plus récente terminée.
 */
export function pickStandingSeasonFromSmLeaguePayload(
  payload: unknown,
  now = new Date(),
): SmLeagueSeasonPick | undefined {
  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload
  if (!data || typeof data !== 'object') return undefined

  const d = data as Record<string, unknown>
  const current = d.currentSeason ?? d.currentseason
  const fromCurrent = readSeasonFields(current)
  if (fromCurrent) return fromCurrent

  const seasonsRaw = d.seasons
  const seasons = Array.isArray(seasonsRaw) ? seasonsRaw : []
  if (!seasons.length) return undefined

  for (const raw of seasons) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const cur = o.is_current ?? o.isCurrent
    if (cur === true || cur === 1 || cur === '1') {
      const pick = readSeasonFields(raw)
      if (pick) return pick
    }
  }

  const today = ymdFromDate(now)
  for (const raw of seasons) {
    const pick = readSeasonFields(raw)
    if (!pick?.seasonStartsAt || !pick.seasonEndsAt) continue
    if (pick.seasonStartsAt <= today && pick.seasonEndsAt >= today) return pick
  }

  const upcoming = seasons
    .map(readSeasonFields)
    .filter((s): s is SmLeagueSeasonPick => Boolean(s?.seasonStartsAt && s.seasonStartsAt > today))
    .sort((a, b) => String(a.seasonStartsAt).localeCompare(String(b.seasonStartsAt)))
  if (upcoming[0]) return upcoming[0]

  const past = seasons
    .map(readSeasonFields)
    .filter((s): s is SmLeagueSeasonPick => Boolean(s?.seasonEndsAt && s.seasonEndsAt < today))
    .sort((a, b) => String(b.seasonEndsAt).localeCompare(String(a.seasonEndsAt)))
  return past[0]
}
