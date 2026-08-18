import { useEffect, useState } from 'react'
import {
  extractMatchLineupBundleFromFixture,
  extractSmRecentFormFromFixture,
  fetchSportMonksFixtureLineups,
  type SmFixture,
  type SmMatchLineupBundle,
  type SmStartingXIs,
} from '../api/sportMonks'
import type { FormResult } from '../types/standings'
import { getSportMonksToken } from '../utils/apiTokens'
import { useTalkFootLiveBundle } from './useTalkFootLiveBundle'

function fixtureHasLineupData(fixture: SmFixture | null): boolean {
  const bundle = extractMatchLineupBundleFromFixture(fixture)
  if (!bundle) return false
  return Boolean(
    (bundle.starters?.home?.length ?? 0) > 0 ||
      (bundle.starters?.away?.length ?? 0) > 0 ||
      (bundle.bench?.home?.length ?? 0) > 0 ||
      (bundle.bench?.away?.length ?? 0) > 0 ||
      bundle.formations.home ||
      bundle.formations.away,
  )
}

export function useSportMonksFixtureLineups(
  sportMonksFixtureId: number | undefined,
  matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming',
) {
  const { liveBundleFixture, liveBundleSettled } = useTalkFootLiveBundle(
    sportMonksFixtureId,
    matchStatus,
  )
  const [bundle, setBundle] = useState<SmMatchLineupBundle | null>(null)
  const [recentForm, setRecentForm] = useState<{ home: FormResult[]; away: FormResult[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!liveBundleFixture || !fixtureHasLineupData(liveBundleFixture)) return
    setBundle(extractMatchLineupBundleFromFixture(liveBundleFixture))
    setRecentForm(extractSmRecentFormFromFixture(liveBundleFixture))
    setLoading(false)
  }, [liveBundleFixture])

  useEffect(() => {
    if (!sportMonksFixtureId) {
      setBundle(null)
      setRecentForm(null)
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setBundle(null)
      setRecentForm(null)
      setLoading(false)
      return
    }

    if (liveBundleFixture && fixtureHasLineupData(liveBundleFixture)) return

    if (!liveBundleSettled) {
      setLoading(true)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchSportMonksFixtureLineups(token, sportMonksFixtureId)
      .then((fx) => {
        if (cancelled) return
        setBundle(extractMatchLineupBundleFromFixture(fx))
        setRecentForm(extractSmRecentFormFromFixture(fx))
      })
      .catch(() => {
        if (!cancelled) {
          setBundle(null)
          setRecentForm(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sportMonksFixtureId, liveBundleFixture, liveBundleSettled])

  const starters: SmStartingXIs | null = bundle?.starters ?? null
  const bench: SmStartingXIs | null = bundle?.bench ?? null
  const formations = bundle?.formations ?? {}
  const lineupSource = bundle?.source ?? 'unknown'

  return { starters, bench, formations, lineupSource, recentForm, bundle, lineupsLoading: loading }
}
