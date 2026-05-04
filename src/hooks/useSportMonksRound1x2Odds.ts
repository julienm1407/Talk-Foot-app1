import { useEffect, useRef, useState } from 'react'
import {
  extract1x2OddsFromOddsList,
  extract1x2OddsFromPredictions,
  extractOverUnder25OddsFromOddsList,
  fetchSportMonksFixturePrematchOdds,
  fetchSportMonksRoundWithOdds,
  type SmBookOdds1x2,
  type SmBookOddsOverUnder25,
} from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'
import { useVisibilityAwareInterval } from './useVisibilityAwareInterval'

function parseRoundIdEnv(raw: string | undefined): number | undefined {
  if (!raw || !String(raw).trim()) return undefined
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function oddsPollMs(status: 'upcoming' | 'live' | 'finished' | undefined): number {
  if (status === 'upcoming') return 90_000
  if (status === 'live') return 120_000
  return 0
}

/**
 * Cotes 1N2 — un bookmaker (`sportMonksOddsBookmakerId` / env).
 * 1) `GET /rounds/{roundId}` si `roundId` connu (match ou env).
 * 2) Sinon ou si pas de triplet : `GET /fixtures/{fixtureId}` avec `odds` (repli fiable sur le salon).
 */
export function useSportMonksRound1x2Odds(
  sportMonksFixtureId: number | undefined,
  sportMonksRoundId: number | undefined,
  matchStatus?: 'upcoming' | 'live' | 'finished',
) {
  const [odds, setOdds] = useState<SmBookOdds1x2 | null>(null)
  const [oddsOverUnder25, setOddsOverUnder25] = useState<SmBookOddsOverUnder25 | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)
  const runRef = useRef<(opts?: { silent?: boolean }) => Promise<void>>(async () => {})

  const envRound = parseRoundIdEnv(import.meta.env.VITE_SPORTMONKS_PREMATCH_ODDS_ROUND_ID)
  const roundId = sportMonksRoundId ?? envRound
  const pollMs = oddsPollMs(matchStatus)
  const pollEnabled = Boolean(sportMonksFixtureId && pollMs > 0)

  useEffect(() => {
    if (!sportMonksFixtureId) {
      setOdds(null)
      setError(null)
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setOdds(null)
      setError(null)
      setLoading(false)
      return
    }

    cancelledRef.current = false

    const run = async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent)
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      let o: SmBookOdds1x2 | null = null
      let ou25: SmBookOddsOverUnder25 | null = null

      try {
        if (roundId) {
          try {
            const round = await fetchSportMonksRoundWithOdds(token, roundId)
            if (cancelledRef.current) return
            const fx = round.fixtures?.find((f) => f.id === sportMonksFixtureId)
            o = extract1x2OddsFromOddsList(fx?.odds, { fixture: fx })
            ou25 = extractOverUnder25OddsFromOddsList(fx?.odds, { fixture: fx })
          } catch {
            /* journée absente ou fixture non listée → repli fixture */
          }
        }

        if ((!o || !ou25) && !cancelledRef.current) {
          const fx2 = await fetchSportMonksFixturePrematchOdds(token, sportMonksFixtureId)
          if (cancelledRef.current) return
          if (!o) o = extract1x2OddsFromOddsList(fx2?.odds, { fixture: fx2 })
          if (!o) o = extract1x2OddsFromPredictions(fx2)
          if (!ou25) ou25 = extractOverUnder25OddsFromOddsList(fx2?.odds, { fixture: fx2 })
        }

        if (!cancelledRef.current) {
          setOdds(o)
          setOddsOverUnder25(ou25)
          if (!o) setError(null)
        }
      } catch (e: unknown) {
        if (cancelledRef.current) return
        if (!silent) {
          setOdds(null)
          setOddsOverUnder25(null)
          setError(e instanceof Error ? e.message : 'Erreur cotes')
        }
      } finally {
        if (!cancelledRef.current && !silent) setLoading(false)
      }
    }

    runRef.current = run
    if (!pollMs) void run()

    return () => {
      cancelledRef.current = true
    }
  }, [sportMonksFixtureId, roundId, pollMs])

  useVisibilityAwareInterval(
    () => void runRef.current({ silent: true }),
    pollMs,
    pollEnabled,
  )

  return { odds1x2: odds, oddsOverUnder25, oddsLoading: loading, oddsError: error }
}
