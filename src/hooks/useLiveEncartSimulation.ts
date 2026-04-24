import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  encartPulseFromSmEvent,
  smEventDedupeKey,
} from '../api/sportMonks/mapSmEventToLiveEncart'
import {
  extractCurrentGoalsFromSmFixture,
  extractLiveMinuteFromSmFixture,
  fetchSportMonksFixtureEventsTimeline,
} from '../api/sportMonks'
import type { Match } from '../types/match'
import type { LiveEncartBurst, LiveEncartRim, LiveEncartToast } from '../types/liveSimulation'
import { createMatchRng, initialScoreFromMatch } from '../types/liveSimulation'
import { getSportMonksToken } from '../utils/apiTokens'

/** Avance douce du chrono entre les actions (réalisme vs score). */
const MINUTE_MS = 9000
const EVENT_MIN_MS = 10_000
const EVENT_MAX_MS = 22_000
/** Rafraîchissement timeline événements SM (cartons, buts…) pour caler les animations. */
const SM_TIMELINE_POLL_MS = 12_000

function randomBetween(rng: () => number, a: number, b: number) {
  return a + rng() * (b - a)
}

/** Évite un tableau type 3-2 affiché à la 8ᵉ minute si les données mock sont incohérentes. */
function coherentMinuteWithScore(
  minuteFromMatch: number,
  goalsTotal: number,
): number {
  if (goalsTotal <= 0) return Math.min(89, Math.max(1, minuteFromMatch))
  const floorByGoals = Math.min(88, 10 + goalsTotal * 12)
  return Math.min(89, Math.max(minuteFromMatch, floorByGoals))
}

export function useLiveEncartSimulation(match: Match | null) {
  const [minute, setMinute] = useState(1)
  const [score, setScore] = useState({ home: 0, away: 0 })
  const [bumpSide, setBumpSide] = useState<'home' | 'away' | null>(null)
  const [burst, setBurst] = useState<LiveEncartBurst>(null)
  const [toast, setToast] = useState<LiveEncartToast>(null)
  const [rim, setRim] = useState<LiveEncartRim>(null)

  const scoreRef = useRef(score)
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const matchRef = useRef(match)
  useEffect(() => {
    matchRef.current = match
  }, [match])

  const rngRef = useRef<() => number>(() => 0.5)
  useEffect(() => {
    if (match && match.status === 'live') {
      rngRef.current = createMatchRng(match.id)
    } else {
      rngRef.current = () => 0.5
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id + statut live seulement
  }, [match?.id, match?.status])

  const bumpClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rimClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastId = useRef(0)
  const smSeenKeysRef = useRef<Set<string>>(new Set())
  const smPrimedRef = useRef(false)

  const active = Boolean(match && match.status === 'live')
  const smTimelineDriving =
    active && Boolean(match?.sportMonksFixtureId) && Boolean(getSportMonksToken())

  const clearBumpSoon = useCallback(() => {
    if (bumpClearRef.current) clearTimeout(bumpClearRef.current)
    bumpClearRef.current = setTimeout(() => setBumpSide(null), 700)
  }, [])

  const flashRim = useCallback((tone: LiveEncartRim, ms: number) => {
    if (rimClearRef.current) clearTimeout(rimClearRef.current)
    setRim(tone)
    rimClearRef.current = setTimeout(() => setRim(null), ms)
  }, [])

  const showToast = useCallback(
    (t: Omit<NonNullable<LiveEncartToast>, 'id'>) => {
      toastId.current += 1
      const id = `t-${toastId.current}`
      setToast({ ...t, id })
      window.setTimeout(() => {
        setToast((cur) => (cur?.id === id ? null : cur))
      }, 2800)
    },
    [],
  )

  useEffect(() => {
    if (!match || match.status !== 'live') {
      setMinute(1)
      setScore({ home: 0, away: 0 })
      scoreRef.current = { home: 0, away: 0 }
      setBumpSide(null)
      setBurst(null)
      setToast(null)
      setRim(null)
      return
    }
    const s = initialScoreFromMatch(match)
    const rawMin = Math.min(89, match.minute ?? 12)
    const m = coherentMinuteWithScore(rawMin, s.home + s.away)
    setMinute(m)
    setScore(s)
    scoreRef.current = s
    setBumpSide(null)
    setBurst(null)
    setToast(null)
    setRim(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ciblé sur id + statut live
  }, [match?.id, match?.status])

  useEffect(() => {
    smSeenKeysRef.current = new Set()
    smPrimedRef.current = false
  }, [match?.id])

  /** À chaque refetch `MatchesContext` (~45 s) : réaligner score + minute SM sans réinitialiser tout l’encart. */
  useEffect(() => {
    if (!match || match.status !== 'live') return
    if (smTimelineDriving) return
    const s = initialScoreFromMatch(match)
    const rawMin = Math.min(89, match.minute ?? 12)
    const m = coherentMinuteWithScore(rawMin, s.home + s.away)
    setScore(s)
    scoreRef.current = s
    setMinute(m)
  }, [match?.id, match?.minute, match?.score?.home, match?.score?.away, smTimelineDriving])

  useEffect(() => {
    if (!active) return
    if (smTimelineDriving) return
    const id = window.setInterval(() => {
      setMinute((mm) => {
        if (mm < 90) return Math.min(90, mm + 1)
        return Math.min(99, mm + 1)
      })
    }, MINUTE_MS)
    return () => clearInterval(id)
  }, [active, smTimelineDriving])

  /** Timeline événements fixture SM : score, minute, animations (remplace la simulation aléatoire). */
  useEffect(() => {
    if (!active || !match?.sportMonksFixtureId) return

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      if (cancelled) return
      const token = getSportMonksToken()
      const fid = matchRef.current?.sportMonksFixtureId
      if (!token || !fid) return

      try {
        const fx = await fetchSportMonksFixtureEventsTimeline(token, fid)
        if (cancelled || !fx) return

        const goals = extractCurrentGoalsFromSmFixture(fx)
        if (goals) {
          setScore(goals)
          scoreRef.current = goals
        }
        const liveMin = extractLiveMinuteFromSmFixture(fx)
        if (Number.isFinite(liveMin) && liveMin >= 0) {
          setMinute(Math.min(99, Math.max(1, liveMin)))
        }

        const raw = Array.isArray(fx.events) ? fx.events : []
        const sorted = [...raw].sort((a, b) => {
          const ma = (typeof a.minute === 'number' ? a.minute : 0) + (typeof a.extra_minute === 'number' ? a.extra_minute : 0)
          const mb = (typeof b.minute === 'number' ? b.minute : 0) + (typeof b.extra_minute === 'number' ? b.extra_minute : 0)
          if (ma !== mb) return ma - mb
          return (a.id ?? 0) - (b.id ?? 0)
        })

        if (!smPrimedRef.current) {
          for (const e of sorted) smSeenKeysRef.current.add(smEventDedupeKey(e))
          smPrimedRef.current = true
          return
        }

        const m = matchRef.current
        if (!m || m.status !== 'live') return

        const newcomers = sorted.filter((e) => !smSeenKeysRef.current.has(smEventDedupeKey(e)))
        newcomers.forEach((ev, i) => {
          const key = smEventDedupeKey(ev)
          smSeenKeysRef.current.add(key)
          const pulse = encartPulseFromSmEvent(ev, m)
          if (!pulse) return
          window.setTimeout(() => {
            if (cancelled) return
            const cur = matchRef.current
            if (!cur || cur.status !== 'live') return
            if (pulse.rim) flashRim(pulse.rim.tone, pulse.rim.ms)
            if (pulse.bumpSide) {
              setBumpSide(pulse.bumpSide)
              clearBumpSoon()
            }
            if (pulse.burst) {
              setBurst(pulse.burst)
              window.setTimeout(() => setBurst(null), 2600)
            }
            if (pulse.toast) showToast(pulse.toast)
            if (pulse.varFollowUp) {
              window.setTimeout(() => {
                if (!cancelled) showToast(pulse.varFollowUp!.toast)
              }, pulse.varFollowUp.afterMs)
            }
          }, i * 420)
        })
      } catch {
        /* réseau / quota : prochain poll */
      }
    }

    void poll()
    intervalId = window.setInterval(poll, SM_TIMELINE_POLL_MS)
    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [active, match?.sportMonksFixtureId, match?.id, clearBumpSoon, flashRim, showToast])

  useEffect(() => {
    if (!active) return
    if (match?.sportMonksFixtureId && getSportMonksToken()) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleNext = () => {
      if (cancelled) return
      const delay = randomBetween(() => rngRef.current(), EVENT_MIN_MS, EVENT_MAX_MS)
      timeoutId = window.setTimeout(runEvent, delay)
    }

    const runEvent = () => {
      if (cancelled) return
      const m = matchRef.current
      if (!m || m.status !== 'live') return

      const prev = scoreRef.current
      const total = prev.home + prev.away
      const rng = () => rngRef.current()
      const r = rng()

      if (r < 0.32 && total < 6) {
        const homeBias = prev.home <= prev.away ? 0.52 : 0.45
        const side = rng() < homeBias ? 'home' : 'away'
        const next = { ...prev, [side]: prev[side] + 1 } as { home: number; away: number }
        scoreRef.current = next
        setScore(next)
        // Faire avancer le chrono comme après une action de jeu (sinon score et minute divergent).
        setMinute((mm) => Math.min(95, mm + Math.floor(5 + rng() * 11)))
        setBumpSide(side)
        clearBumpSoon()
        flashRim('goal', 900)
        setBurst({
          kind: 'goal',
          side,
          teamName: side === 'home' ? m.home.shortName : m.away.shortName,
        })
        window.setTimeout(() => setBurst(null), 2600)
        scheduleNext()
        return
      }

      if (r < 0.58) {
        const side = rng() < 0.5 ? 'home' : 'away'
        const team = side === 'home' ? m.home : m.away
        setMinute((mm) => Math.min(95, mm + 1))
        flashRim('yellow', 650)
        showToast({
          kind: 'yellow',
          text: `Carton jaune — ${team.shortName}`,
          side,
        })
        scheduleNext()
        return
      }

      if (r < 0.72) {
        const side = rng() < 0.5 ? 'home' : 'away'
        const team = side === 'home' ? m.home : m.away
        setMinute((mm) => Math.min(95, mm + 2))
        flashRim('red', 800)
        showToast({
          kind: 'red',
          text: `Carton rouge — ${team.shortName}`,
          side,
        })
        scheduleNext()
        return
      }

      if (r < 0.84) {
        setMinute((mm) => Math.min(95, mm + 1))
        flashRim('var', 1200)
        const lines = [
          'VAR — situation analysée',
          'VAR — main ? Les images sont revues',
          'VAR — position de hors-jeu vérifiée',
        ]
        const line = lines[Math.floor(rng() * lines.length)] ?? lines[0]
        setBurst({ kind: 'var', line })
        window.setTimeout(() => {
          setBurst(null)
          const ok = rng() > 0.35
          showToast({
            kind: 'var_line',
            text: ok ? 'Décision : situation validée' : 'Décision : annulée',
          })
        }, 2200)
        scheduleNext()
        return
      }

      setMinute((mm) => Math.min(95, mm + 1))
      showToast({
        kind: 'chance',
        text:
          rng() > 0.5
            ? 'Grosse occasion — la défense dévie en corner !'
            : 'Frappé puissante — le gardien s’interpose !',
      })
      flashRim(rng() > 0.6 ? 'goal' : 'var', 400)
      scheduleNext()
    }

    scheduleNext()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [active, match?.id, match?.sportMonksFixtureId, clearBumpSoon, flashRim, showToast])

  useEffect(() => {
    return () => {
      if (bumpClearRef.current) clearTimeout(bumpClearRef.current)
      if (rimClearRef.current) clearTimeout(rimClearRef.current)
    }
  }, [])

  return useMemo(
    () => ({
      active,
      minute,
      score,
      bumpSide,
      burst,
      toast,
      rim,
    }),
    [active, minute, score, bumpSide, burst, toast, rim],
  )
}
