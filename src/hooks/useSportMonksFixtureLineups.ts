import { useEffect, useState } from 'react'
import {
  extractMatchLineupBundleFromFixture,
  extractSmRecentFormFromFixture,
  fetchSportMonksFixtureLineups,
  type SmMatchLineupBundle,
  type SmStartingXIs,
} from '../api/sportMonks'
import type { FormResult } from '../types/standings'
import { getSportMonksToken } from '../utils/apiTokens'
import { useTalkFootLiveBundle } from './useTalkFootLiveBundle'

export function useSportMonksFixtureLineups(sportMonksFixtureId: number | undefined) {
  const { liveBundleFixture } = useTalkFootLiveBundle(sportMonksFixtureId, 'upcoming')
  const [bundle, setBundle] = useState<SmMatchLineupBundle | null>(null)
  const [recentForm, setRecentForm] = useState<{ home: FormResult[]; away: FormResult[] } | null>(null)
  const [loading, setLoading] = useState(false)

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
    let cancelled = false
    setLoading(true)
    setBundle(null)
    setRecentForm(null)
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
  }, [sportMonksFixtureId])

  useEffect(() => {
    if (!liveBundleFixture) return
    setBundle(extractMatchLineupBundleFromFixture(liveBundleFixture))
    setRecentForm(extractSmRecentFormFromFixture(liveBundleFixture))
    setLoading(false)
  }, [liveBundleFixture])

  const starters: SmStartingXIs | null = bundle?.starters ?? null
  const bench: SmStartingXIs | null = bundle?.bench ?? null
  const formations = bundle?.formations ?? {}
  const lineupSource = bundle?.source ?? 'unknown'

  return { starters, bench, formations, lineupSource, recentForm, bundle, lineupsLoading: loading }
}
