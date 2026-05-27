import { useEffect, useRef, useState } from 'react'
import {
  extract1x2OddsFromOddsList,
  extract1x2OddsFromPredictions,
  extractOverUnder25OddsFromOddsList,
  fetchSportMonksFixturePrematchOdds,
  fetchSportMonksFixturePredictionsOnly,
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

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** RNG déterministe (stable par fixture/round) pour garder les mêmes cotes entre refresh. */
function seeded01(seed: number): number {
  const x = Math.sin(seed * 12_989.123) * 43_758.5453
  return x - Math.floor(x)
}

function normalize3(a: number, b: number, c: number): [number, number, number] {
  const s = a + b + c
  if (!Number.isFinite(s) || s <= 0) return [0.42, 0.28, 0.3]
  return [a / s, b / s, c / s]
}

function toOddFromProb(p: number, overround = 1.06): number {
  const implied = clamp(p * overround, 0.02, 0.92)
  return Math.round(clamp(1 / implied, 1.2, 25) * 100) / 100
}

function synthetic1x2Odds(fixtureId: number, roundId?: number): SmBookOdds1x2 {
  const s1 = seeded01(fixtureId + (roundId ?? 0) * 17 + 1)
  const s2 = seeded01(fixtureId + (roundId ?? 0) * 17 + 2)
  // Prior: léger avantage domicile + bruit stable.
  const homeRaw = 0.44 + 0.1 * (s1 - 0.5) + 0.07
  const drawRaw = 0.26 + 0.08 * (s2 - 0.5)
  const awayRaw = clamp(1 - homeRaw - drawRaw, 0.15, 0.55)
  const [ph, pd, pa] = normalize3(homeRaw, drawRaw, awayRaw)
  return {
    home: toOddFromProb(ph, 1.06),
    draw: toOddFromProb(pd, 1.06),
    away: toOddFromProb(pa, 1.06),
  }
}

function syntheticOverUnder25Odds(fixtureId: number, roundId?: number): SmBookOddsOverUnder25 {
  // Modèle simple Poisson sur total buts.
  const s = seeded01(fixtureId + (roundId ?? 0) * 29 + 9)
  const lambda = 2.55 + (s - 0.5) * 0.7 // ~[2.2 ; 2.9]
  const exp = Math.exp(-lambda)
  const pUnder = exp * (1 + lambda + (lambda * lambda) / 2) // P(X<=2)
  const pOver = clamp(1 - pUnder, 0.2, 0.8)
  return {
    over: toOddFromProb(pOver, 1.05),
    under: toOddFromProb(1 - pOver, 1.05),
  }
}

/**
 * Cotes 1N2 — un bookmaker (`sportMonksOddsBookmakerId` / env).
 * 1) `GET /rounds/{roundId}` si `roundId` connu (match ou env).
 * 2) Sinon ou si pas de triplet : `GET /fixtures/{fixtureId}` avec `odds` (repli fiable sur la tribune).
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
      let syntheticMode = false

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
          let fx2 = null
          try {
            fx2 = await fetchSportMonksFixturePrematchOdds(token, sportMonksFixtureId)
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            // Plans sans accès include `odds`: on bascule sur predictions-only.
            if (/403/i.test(msg) && /odds/i.test(msg)) {
              fx2 = await fetchSportMonksFixturePredictionsOnly(token, sportMonksFixtureId)
            } else {
              throw e
            }
          }
          if (cancelledRef.current) return
          if (!o) o = extract1x2OddsFromOddsList(fx2?.odds, { fixture: fx2 ?? undefined })
          if (!o) o = extract1x2OddsFromPredictions(fx2)
          if (!ou25) ou25 = extractOverUnder25OddsFromOddsList(fx2?.odds, { fixture: fx2 ?? undefined })
        }

        if ((!o || !ou25) && !cancelledRef.current) {
          // Filet final: cotes estimées pour garder le widget utilisable sans droits `odds`.
          if (!o) o = synthetic1x2Odds(sportMonksFixtureId, roundId)
          if (!ou25) ou25 = syntheticOverUnder25Odds(sportMonksFixtureId, roundId)
          syntheticMode = true
        }

        if (!cancelledRef.current) {
          setOdds(o)
          setOddsOverUnder25(ou25)
          setError(
            syntheticMode
              ? 'Mode cotes estimées actif (fallback temporaire en attendant accès odds).'
              : null,
          )
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
