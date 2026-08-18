import { useEffect, useState } from 'react'
import {
  extractLeagueStandingRowsFromSmStandingsEnvelope,
  extractLeagueStandingRowsFromSmTeamsSeasonEnvelope,
  fetchSportMonksLeagueById,
  fetchSportMonksStandingsBySeason,
  fetchSportMonksStandingsLiveByLeague,
  fetchSportMonksTeamsBySeason,
  pickStandingSeasonFromSmLeaguePayload,
  type SmLeagueSeasonPick,
} from '../api/sportMonks'
import { apiNameToOurId, SM_LEAGUE_ID_BY_TALKFOOT_COMP } from '../api/footballApi'
import type { BigFiveLeagueId, LeagueStandingRow } from '../data/leagueStandings'
import { SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE } from '../data/sportMonksStandingSeasons'
import { teams } from '../data/teams'
import { getSportMonksToken } from '../utils/apiTokens'

function envSeasonFallback(): number | undefined {
  const e = import.meta.env.VITE_SPORTMONKS_STANDING_SEASON_ID
  if (!e?.trim()) return undefined
  const n = Number(String(e).trim())
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export type StandingsDataSource = 'live' | 'season' | 'teamsSeason' | null

export function isStandingsPreSeason(rows: LeagueStandingRow[]): boolean {
  return rows.length > 0 && rows.every((r) => r.played === 0)
}

function sanitizeRowsForLeague(rows: LeagueStandingRow[], leagueId: BigFiveLeagueId): LeagueStandingRow[] {
  const idsByLeague = new Map<string, Set<string>>()
  for (const [lid, list] of Object.entries(teams)) {
    idsByLeague.set(
      lid,
      new Set((list as ReadonlyArray<{ id: string }>).map((t) => t.id)),
    )
  }
  const currentIds = idsByLeague.get(leagueId) ?? new Set<string>()
  const allKnownIds = new Set<string>()
  for (const ids of idsByLeague.values()) {
    for (const id of ids) allKnownIds.add(id)
  }

  const inferredIdFromRow = (r: LeagueStandingRow): string | null => {
    if (allKnownIds.has(r.teamId)) return r.teamId
    const label = r.displayName?.trim()
    if (!label) return null
    const inferred = apiNameToOurId(label)
    return allKnownIds.has(inferred) ? inferred : null
  }

  // Retire les équipes connues d'autres ligues.
  // On exploite aussi l'id inféré depuis `displayName` quand il est fiable.
  const crossLeagueFiltered = rows.filter((r) => {
    const inferred = inferredIdFromRow(r)
    if (inferred != null) return currentIds.has(inferred)
    if (allKnownIds.has(r.teamId)) return currentIds.has(r.teamId)
    return true
  })

  // Déduplique les lignes par équipe canonique (évite les doublons PSG, etc.).
  const byKey = new Map<string, LeagueStandingRow>()
  for (const r of crossLeagueFiltered) {
    const inferred = inferredIdFromRow(r)
    const key = inferred != null ? `canon:${inferred}` : `raw:${r.teamId}`
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, r)
      continue
    }
    const prevRank = Number.isFinite(prev.rank) ? prev.rank : Number.POSITIVE_INFINITY
    const nextRank = Number.isFinite(r.rank) ? r.rank : Number.POSITIVE_INFINITY
    if (nextRank < prevRank) {
      byKey.set(key, r)
      continue
    }
    if (nextRank > prevRank) continue

    const prevScore = prev.played * 1000 + prev.points * 10 + prev.gf - prev.ga
    const nextScore = r.played * 1000 + r.points * 10 + r.gf - r.ga
    if (nextScore > prevScore) byKey.set(key, r)
  }

  return [...byKey.values()].sort(
    (a, b) => a.rank - b.rank || b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga),
  )
}

/**
 * Classement Big 5 :
 * 1. `standings/live/leagues/{leagueId}`
 * 2. si vide ou erreur : `standings/seasons/{seasonId}` (map / `VITE_SPORTMONKS_STANDING_SEASON_ID`)
 * 3. si encore vide : `teams/seasons/{seasonId}?include=statistics.details.type` (même id saison que ton exemple SM)
 */
export function useSportMonksLeagueStandings(
  leagueId: BigFiveLeagueId | null,
  enabled = true,
) {
  const [rows, setRows] = useState<LeagueStandingRow[]>([])
  const [source, setSource] = useState<StandingsDataSource>(null)
  const [seasonMeta, setSeasonMeta] = useState<SmLeagueSeasonPick | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !leagueId) {
      setRows([])
      setSource(null)
      setSeasonMeta(null)
      setLoading(false)
      setError(null)
      return
    }

    const token = getSportMonksToken()
    if (!token) {
      setRows([])
      setSource(null)
      setSeasonMeta(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setRows([])
    setSource(null)
    setSeasonMeta(null)

    const smLid = SM_LEAGUE_ID_BY_TALKFOOT_COMP[leagueId]
    const staticSeasonId =
      SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE[leagueId] ?? envSeasonFallback()

    void (async () => {
      let lastError: string | null = null
      let next: LeagueStandingRow[] = []
      let src: StandingsDataSource = null
      let resolvedSeason: SmLeagueSeasonPick | null = null

      try {
        try {
          const liveJson = await fetchSportMonksStandingsLiveByLeague(token, smLid)
          if (cancelled) return
          next = extractLeagueStandingRowsFromSmStandingsEnvelope(liveJson, leagueId)
          if (next.length) src = 'live'
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e)
        }

        let seasonId = staticSeasonId ?? null
        if (!next.length) {
          try {
            const leagueJson = await fetchSportMonksLeagueById(token, smLid)
            if (cancelled) return
            resolvedSeason = pickStandingSeasonFromSmLeaguePayload(leagueJson) ?? null
            if (resolvedSeason?.seasonId) seasonId = resolvedSeason.seasonId
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            if (!lastError) lastError = msg
          }
        }

        if (!next.length && seasonId != null) {
          try {
            const seasonJson = await fetchSportMonksStandingsBySeason(token, seasonId)
            if (cancelled) return
            next = extractLeagueStandingRowsFromSmStandingsEnvelope(seasonJson, leagueId)
            if (next.length) {
              src = 'season'
              lastError = null
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            if (!lastError) lastError = msg
          }
        }

        if (!next.length && seasonId != null) {
          try {
            const teamsJson = await fetchSportMonksTeamsBySeason(token, seasonId)
            if (cancelled) return
            next = extractLeagueStandingRowsFromSmTeamsSeasonEnvelope(teamsJson, leagueId)
            if (next.length) {
              src = 'teamsSeason'
              lastError = null
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            if (!lastError) lastError = msg
          }
        }

        setRows(sanitizeRowsForLeague(next, leagueId))
        setSource(src)
        setSeasonMeta(resolvedSeason)
        setError(next.length ? null : lastError)
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setSource(null)
          setSeasonMeta(null)
          setError(e instanceof Error ? e.message : 'Erreur classements SportMonks')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [leagueId, enabled])

  return {
    standingsRows: rows,
    standingsSource: source,
    standingsSeasonMeta: seasonMeta,
    standingsPreSeason: isStandingsPreSeason(rows),
    standingsLoading: loading,
    standingsError: error,
  }
}
