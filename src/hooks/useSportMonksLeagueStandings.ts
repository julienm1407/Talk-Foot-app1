import { useEffect, useState } from 'react'
import {
  extractLeagueStandingRowsFromSmStandingsEnvelope,
  extractLeagueStandingRowsFromSmTeamsSeasonEnvelope,
  fetchSportMonksStandingsBySeason,
  fetchSportMonksStandingsLiveByLeague,
  fetchSportMonksTeamsBySeason,
} from '../api/sportMonks'
import { SM_LEAGUE_ID_BY_TALKFOOT_COMP } from '../api/footballApi'
import type { BigFiveLeagueId, LeagueStandingRow } from '../data/leagueStandings'
import { SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE } from '../data/sportMonksStandingSeasons'
import { getSportMonksToken } from '../utils/apiTokens'

function envSeasonFallback(): number | undefined {
  const e = import.meta.env.VITE_SPORTMONKS_STANDING_SEASON_ID
  if (!e?.trim()) return undefined
  const n = Number(String(e).trim())
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export type StandingsDataSource = 'live' | 'season' | 'teamsSeason' | null

/**
 * Classement Big 5 :
 * 1. `standings/live/leagues/{leagueId}`
 * 2. si vide ou erreur : `standings/seasons/{seasonId}` (map / `VITE_SPORTMONKS_STANDING_SEASON_ID`)
 * 3. si encore vide : `teams/seasons/{seasonId}?include=statistics.details.type` (même id saison que ton exemple SM)
 */
export function useSportMonksLeagueStandings(leagueId: BigFiveLeagueId) {
  const [rows, setRows] = useState<LeagueStandingRow[]>([])
  const [source, setSource] = useState<StandingsDataSource>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getSportMonksToken()
    if (!token) {
      setRows([])
      setSource(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setRows([])
    setSource(null)

    const smLid = SM_LEAGUE_ID_BY_TALKFOOT_COMP[leagueId]
    const seasonId =
      SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE[leagueId] ?? envSeasonFallback()

    void (async () => {
      let lastError: string | null = null
      let next: LeagueStandingRow[] = []
      let src: StandingsDataSource = null

      try {
        try {
          const liveJson = await fetchSportMonksStandingsLiveByLeague(token, smLid)
          if (cancelled) return
          next = extractLeagueStandingRowsFromSmStandingsEnvelope(liveJson, leagueId)
          if (next.length) src = 'live'
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e)
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

        setRows(next)
        setSource(src)
        setError(next.length ? null : lastError)
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setSource(null)
          setError(e instanceof Error ? e.message : 'Erreur classements SportMonks')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [leagueId])

  return {
    standingsRows: rows,
    standingsSource: source,
    standingsLoading: loading,
    standingsError: error,
  }
}
