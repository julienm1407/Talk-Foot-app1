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
import {
  DEMO_BARCA_PSG_LINEUPS,
  isDemoBarcaPsgShowcaseMatch,
} from '../data/demoBarcaPsgShowcase'

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
  talkFootMatchId?: string,
) {
  const isShowcase = isDemoBarcaPsgShowcaseMatch(talkFootMatchId)
  const { liveBundleFixture, liveBundleSettled } = useTalkFootLiveBundle(
    isShowcase ? undefined : sportMonksFixtureId,
    matchStatus,
  )
  const [bundle, setBundle] = useState<SmMatchLineupBundle | null>(
    isShowcase ? DEMO_BARCA_PSG_LINEUPS : null,
  )
  const [recentForm, setRecentForm] = useState<{ home: FormResult[]; away: FormResult[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isShowcase) {
      setBundle(DEMO_BARCA_PSG_LINEUPS)
      setRecentForm(null)
      setLoading(false)
      return
    }
    if (!liveBundleFixture || !fixtureHasLineupData(liveBundleFixture)) return
    setBundle(extractMatchLineupBundleFromFixture(liveBundleFixture))
    setRecentForm(extractSmRecentFormFromFixture(liveBundleFixture))
    setLoading(false)
  }, [liveBundleFixture, isShowcase])

  useEffect(() => {
    if (isShowcase) {
      setBundle(DEMO_BARCA_PSG_LINEUPS)
      setRecentForm(null)
      setLoading(false)
      return
    }
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
  }, [sportMonksFixtureId, liveBundleFixture, liveBundleSettled, isShowcase])

  const starters: SmStartingXIs | null = bundle?.starters ?? null
  const bench: SmStartingXIs | null = bundle?.bench ?? null
  const formations = bundle?.formations ?? {}
  const lineupSource = bundle?.source ?? 'unknown'

  return { starters, bench, formations, lineupSource, recentForm, bundle, lineupsLoading: loading }
}
