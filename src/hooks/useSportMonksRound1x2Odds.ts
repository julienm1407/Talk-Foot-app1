import { useEffect, useState } from 'react'
import {
  extract1x2OddsFromOddsList,
  fetchSportMonksFixturePrematchOdds,
  fetchSportMonksRoundWithOdds,
  type SmBookOdds1x2,
} from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'

function parseRoundIdEnv(raw: string | undefined): number | undefined {
  if (!raw || !String(raw).trim()) return undefined
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function oddsPollMs(status: 'upcoming' | 'live' | 'finished' | undefined): number {
  if (status === 'upcoming') return 60_000
  if (status === 'live') return 90_000
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const envRound = parseRoundIdEnv(import.meta.env.VITE_SPORTMONKS_PREMATCH_ODDS_ROUND_ID)
  const roundId = sportMonksRoundId ?? envRound
  const pollMs = oddsPollMs(matchStatus)

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

    let cancelled = false

    const run = async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent)
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      let o: SmBookOdds1x2 | null = null

      try {
        if (roundId) {
          try {
            const round = await fetchSportMonksRoundWithOdds(token, roundId)
            if (cancelled) return
            const fx = round.fixtures?.find((f) => f.id === sportMonksFixtureId)
            o = extract1x2OddsFromOddsList(fx?.odds, { fixture: fx })
          } catch {
            /* journée absente ou fixture non listée → repli fixture */
          }
        }

        if (!o && !cancelled) {
          const fx2 = await fetchSportMonksFixturePrematchOdds(token, sportMonksFixtureId)
          if (cancelled) return
          o = extract1x2OddsFromOddsList(fx2?.odds, { fixture: fx2 })
        }

        if (!cancelled) {
          setOdds(o)
          if (!o) setError(null)
        }
      } catch (e: unknown) {
        if (cancelled) return
        if (!silent) {
          setOdds(null)
          setError(e instanceof Error ? e.message : 'Erreur cotes')
        }
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    void run()
    if (!pollMs) {
      return () => {
        cancelled = true
      }
    }

    const id = window.setInterval(() => void run({ silent: true }), pollMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [sportMonksFixtureId, roundId, pollMs])

  return { odds1x2: odds, oddsLoading: loading, oddsError: error }
}
