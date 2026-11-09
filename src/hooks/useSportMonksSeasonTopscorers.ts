import { useEffect, useState } from 'react'
import {
  extractSeasonTopscorersFromSmPayload,
  type SeasonTopscorerRow,
} from '../api/sportMonks/extractSeasonTopscorersFromSm'
import { fetchSportMonksLeagueById, fetchSportMonksSeasonTopscorers } from '../api/sportMonks/sportMonksApi'
import { pickStandingSeasonFromSmLeaguePayload } from '../api/sportMonks/pickStandingSeasonIdFromSmLeague'
import { SM_LEAGUE_ID_BY_TALKFOOT_COMP } from '../api/footballApi'
import type { RankingsLeagueId } from '../data/leagueStandings'
import { SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE } from '../data/sportMonksStandingSeasons'
import { getSportMonksToken } from '../utils/apiTokens'

const cache = new Map<string, SeasonTopscorerRow[]>()

export function useSportMonksSeasonTopscorers(
  leagueId: RankingsLeagueId | null,
  enabled = true,
) {
  const [rows, setRows] = useState<SeasonTopscorerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !leagueId) {
      setRows([])
      setLoading(false)
      setError(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setRows([])
      setLoading(false)
      setError(null)
      return
    }
    const hit = cache.get(leagueId)
    if (hit) {
      setRows(hit)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setRows([])

    void (async () => {
      try {
        let seasonId = SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE[leagueId] ?? null
        const smLid = SM_LEAGUE_ID_BY_TALKFOOT_COMP[leagueId]
        if (seasonId == null && smLid) {
          const leagueJson = await fetchSportMonksLeagueById(token, smLid)
          if (cancelled) return
          seasonId = pickStandingSeasonFromSmLeaguePayload(leagueJson)?.seasonId ?? null
        }
        if (seasonId == null) {
          if (!cancelled) {
            setRows([])
            setError('Saison indisponible pour les buteurs.')
          }
          return
        }
        const json = await fetchSportMonksSeasonTopscorers(token, seasonId)
        if (cancelled) return
        const next = extractSeasonTopscorersFromSmPayload(json)
        cache.set(leagueId, next)
        setRows(next)
        setError(next.length ? null : 'Aucun buteur pour cette saison.')
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setError(e instanceof Error ? e.message : 'Impossible de charger les buteurs.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [leagueId, enabled])

  return { topscorers: rows, topscorersLoading: loading, topscorersError: error }
}
