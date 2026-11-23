import { useEffect, useState } from 'react'
import type { Match } from '../types/match'
import {
  fetchSportMonksHeadToHead,
  fetchSportMonksTeamUpcoming,
  listRecentClubResultsFromLatest,
  smFixtureToMatch,
  type ClubScheduleListItem,
} from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'

export type HeadToHeadRow = {
  matchId: string
  kickoffIso: string
  league: string
  homeName: string
  awayName: string
  scoreLine: string
}

function toH2hRow(m: Match): HeadToHeadRow | null {
  if (m.status !== 'finished' || !m.score) return null
  return {
    matchId: m.id,
    kickoffIso: m.kickoffAt,
    league: m.competition.shortName,
    homeName: m.home.shortName || m.home.name,
    awayName: m.away.shortName || m.away.name,
    scoreLine: `${m.score.home}-${m.score.away}`,
  }
}

export function useMatchHeadToHead(match: Match | null, enabled: boolean) {
  const [homeRecent, setHomeRecent] = useState<ClubScheduleListItem[]>([])
  const [awayRecent, setAwayRecent] = useState<ClubScheduleListItem[]>([])
  const [h2h, setH2h] = useState<HeadToHeadRow[]>([])
  const [loading, setLoading] = useState(false)

  const hSm = match?.home.sportMonksTeamId
  const aSm = match?.away.sportMonksTeamId

  useEffect(() => {
    if (!match || !enabled || hSm == null || aSm == null) {
      setHomeRecent([])
      setAwayRecent([])
      setH2h([])
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setHomeRecent([])
      setAwayRecent([])
      setH2h([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchSportMonksTeamUpcoming(token, hSm),
      fetchSportMonksTeamUpcoming(token, aSm),
      fetchSportMonksHeadToHead(token, hSm, aSm).catch(() => [] as Awaited<
        ReturnType<typeof fetchSportMonksHeadToHead>
      >),
    ])
      .then(([envH, envA, h2hFx]) => {
        if (cancelled) return
        setHomeRecent(listRecentClubResultsFromLatest(envH, match.home.id, { sportMonksTeamId: hSm, limit: 5 }))
        setAwayRecent(listRecentClubResultsFromLatest(envA, match.away.id, { sportMonksTeamId: aSm, limit: 5 }))
        const rows = h2hFx
          .map((fx) => {
            try {
              return toH2hRow(smFixtureToMatch(fx))
            } catch {
              return null
            }
          })
          .filter((x): x is HeadToHeadRow => Boolean(x))
          .sort((a, b) => +new Date(b.kickoffIso) - +new Date(a.kickoffIso))
          .slice(0, 5)
        setH2h(rows)
      })
      .catch(() => {
        if (!cancelled) {
          setHomeRecent([])
          setAwayRecent([])
          setH2h([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, hSm, aSm, match?.away.id, match?.home.id, match?.id])

  return { homeRecent, awayRecent, h2h, loading }
}
