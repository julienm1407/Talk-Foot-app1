import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useMatches } from '../../contexts/MatchesContext'
import {
  fetchSportMonksFixtureEventsTimeline,
  fetchTalkFootLiveBundleFixture,
} from '../../api/sportMonks/sportMonksApi'
import { extractLiveMinuteFromSmFixture } from '../../api/sportMonks/transformSportMonksToMatch'
import {
  liveAlertsFromFixture,
  playerNamesMatch,
  sportMonksFixtureIdFromMatch,
} from '../../utils/liveMatchAlertEvents'
import { getSportMonksToken } from '../../utils/apiTokens'
import { DEFAULT_MATCH_ALERT_PREFS } from '../../types/fanPreferences'
import { buildCloudFavoriteMatchWatches } from '../../utils/favoriteKickoffWatches'
import { fireImmediateMatchNotification, isNativePushRuntime } from './nativeMatchPush'

const SEEN_KEY = 'talkfoot.liveAlertSeen.v1'
const POLL_MS = 12_000

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-400)))
  } catch {
    /* quota */
  }
}

/**
 * Buts / cartons / mi-temps / final en notif locale tant que l’app peut poller le live.
 * Le premier snapshot d’un match ne notifie pas (évite un spam à l’ouverture).
 */
export function LiveMatchAlertsHost() {
  const { matches } = useMatches()
  const {
    favoriteClubIds,
    favoriteMatchIds,
    favoritePlayers,
    kickoffAlertsEnabled,
    matchAlertPrefs,
  } = useFanPreferences()
  const primedRef = useRef(new Set<string>())
  const seenRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!isNativePushRuntime() || !kickoffAlertsEnabled) return
    if (!seenRef.current) seenRef.current = loadSeen()

    let cancelled = false

    const tick = async () => {
      const watches = buildCloudFavoriteMatchWatches(matches, {
        favoriteClubIds,
        favoriteMatchIds,
        favoritePlayerTeamIds: favoritePlayers.map((p) => p.teamId),
      })
      const liveIds = new Set(matches.filter((m) => m.status === 'live').map((m) => m.id))
      const followed = watches.filter((w) => liveIds.has(w.matchId))
      if (followed.length === 0) return

      const seen = seenRef.current ?? new Set<string>()
      for (const watch of followed.slice(0, 8)) {
        if (cancelled) return
        const match = matches.find((m) => m.id === watch.matchId)
        const fixtureId = match ? sportMonksFixtureIdFromMatch(match) : null
        if (!fixtureId) continue
        let fx = await fetchTalkFootLiveBundleFixture(fixtureId)
        if (!fx) {
          const token = getSportMonksToken()
          if (token) {
            fx = await fetchSportMonksFixtureEventsTimeline(token, fixtureId).catch(() => null)
          }
        }
        if (cancelled || !fx) continue
        const alerts = liveAlertsFromFixture(fx)
        const liveMinute = extractLiveMinuteFromSmFixture(fx)
        const primed = primedRef.current.has(watch.matchId)
        const prefs = matchAlertPrefs(watch.matchId)
        const effective = { ...DEFAULT_MATCH_ALERT_PREFS, ...prefs }
        for (const alert of alerts) {
          const key = `${watch.matchId}:${alert.kind}`
          if (seen.has(key)) continue
          seen.add(key)
          if (!primed) {
            const eventMin = alert.minute ?? 0
            const stale =
              eventMin > 0 && liveMinute > 0 && liveMinute - eventMin > 2
            if (stale) continue
          }

          const scorerFollowed = favoritePlayers.some((p) => playerNamesMatch(p.name, alert.playerName))
          let allowed = false
          if (alert.category === 'goal') {
            allowed = effective.goal || (effective.scorer && scorerFollowed)
          } else if (alert.category === 'card') {
            allowed = effective.card
          } else if (alert.category === 'halftime') {
            allowed = effective.halftime
          } else if (alert.category === 'fulltime') {
            allowed = effective.fulltime
          }
          if (!allowed) continue

          await fireImmediateMatchNotification({
            idKey: key,
            title: watch.title,
            body: alert.body,
            href: watch.href,
          }).catch(() => undefined)
        }
        primedRef.current.add(watch.matchId)
      }
      seenRef.current = seen
      saveSeen(seen)
    }

    void tick()
    const interval = window.setInterval(() => {
      void tick()
    }, POLL_MS)

    const sub = App.addListener('appStateChange', (state) => {
      if (state.isActive) void tick()
    })

    return () => {
      cancelled = true
      window.clearInterval(interval)
      void sub.then((h) => h.remove())
    }
  }, [
    matches,
    favoriteClubIds,
    favoriteMatchIds,
    favoritePlayers,
    kickoffAlertsEnabled,
    matchAlertPrefs,
  ])

  return null
}
