import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  encartPulseFromSmEvent,
  smEventDedupeKey,
} from '../api/sportMonks/mapSmEventToLiveEncart'
import {
  extractCurrentGoalsFromSmFixture,
  extractLiveMinuteFromSmFixture,
  fetchSportMonksFixtureEventsTimeline,
  liveClockPausedFromSmFixture,
  liveSecondHalfFromSmFixture,
} from '../api/sportMonks'
import type { Match } from '../types/match'
import type { LiveEncartBurst, LiveEncartRim, LiveEncartToast } from '../types/liveSimulation'
import { createMatchRng, initialScoreFromMatch } from '../types/liveSimulation'
import { getSportMonksToken } from '../utils/apiTokens'
import { useEffectiveMatchStatus } from './useEffectiveMatchStatus'
import { isDemoBarcaPsgShowcaseMatch } from '../data/demoBarcaPsgShowcase'

/** Avance du chrono démo (sans SportMonks) : 1 minute affichée ≈ 1 minute réelle. */
const MINUTE_MS = 60_000
const EVENT_MIN_MS = 10_000
const EVENT_MAX_MS = 22_000
/** Rafraîchissement timeline événements SM (cartons, buts…) pour caler les animations. */
const SM_TIMELINE_POLL_MS = 12_000

function randomBetween(rng: () => number, a: number, b: number) {
  return a + rng() * (b - a)
}

function normalizeScore(s: { home: unknown; away: unknown }): { home: number; away: number } {
  const h = Number(s.home)
  const a = Number(s.away)
  return {
    home: Number.isFinite(h) ? h : 0,
    away: Number.isFinite(a) ? a : 0,
  }
}

/** Minute de départ encart : 0 SM = inconnu, pas une vraie 0'. */
function seedMinuteFromMatch(match: Match): number {
  const m = Math.round(Number(match.minute) || 0)
  if (m > 0) return Math.min(89, m)
  return 1
}

export function useLiveEncartSimulation(match: Match | null) {
  const effectiveStatus = useEffectiveMatchStatus(match)
  const [minute, setMinute] = useState(1)
  const [score, setScore] = useState({ home: 0, away: 0 })
  const [bumpSide, setBumpSide] = useState<'home' | 'away' | null>(null)
  const [burst, setBurst] = useState<LiveEncartBurst>(null)
  const [toast, setToast] = useState<LiveEncartToast>(null)
  const [rim, setRim] = useState<LiveEncartRim>(null)
  const [liveClockPaused, setLiveClockPaused] = useState(false)
  const [liveInSecondHalf, setLiveInSecondHalf] = useState(false)

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
    if (match && effectiveStatus === 'live') {
      rngRef.current = createMatchRng(match.id)
    } else {
      rngRef.current = () => 0.5
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id + statut live effectif
  }, [match?.id, effectiveStatus])

  const bumpClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rimClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastId = useRef(0)
  const smSeenKeysRef = useRef<Set<string>>(new Set())
  const smPrimedRef = useRef(false)

  /** Dernière minute « officielle » SM — pas d’extrapolation client entre deux syncs. */
  const minuteAnchorRef = useRef<{ m: number; atMs: number }>({ m: 1, atMs: Date.now() })

  const active = Boolean(match && effectiveStatus === 'live')
  const smTimelineDriving =
    active && Boolean(match?.sportMonksFixtureId) && Boolean(getSportMonksToken())

  const snapMinuteFromAuthority = useCallback((m: number) => {
    const clamped = Math.min(99, Math.max(1, Math.round(m)))
    minuteAnchorRef.current = { m: clamped, atMs: Date.now() }
    setMinute(clamped)
  }, [])

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
    if (!match || effectiveStatus !== 'live') {
      minuteAnchorRef.current = { m: 1, atMs: Date.now() }
      setMinute(1)
      setScore({ home: 0, away: 0 })
      scoreRef.current = { home: 0, away: 0 }
      setBumpSide(null)
      setBurst(null)
      setToast(null)
      setRim(null)
      setLiveClockPaused(false)
      setLiveInSecondHalf(false)
      return
    }
    const s = normalizeScore(initialScoreFromMatch(match))
    const m = seedMinuteFromMatch(match)
    snapMinuteFromAuthority(m)
    setScore(s)
    scoreRef.current = s
    setBumpSide(null)
    setBurst(null)
    setToast(null)
    setRim(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ciblé sur id + statut live effectif (+ snap stable)
  }, [match?.id, effectiveStatus, snapMinuteFromAuthority])

  useEffect(() => {
    smSeenKeysRef.current = new Set()
    smPrimedRef.current = false
  }, [match?.id])

  /** Minute calendrier SM : quand la timeline conduit l’encart, réaligner sur le calendrier (même logique « cohérente » que le reset). */
  useEffect(() => {
    if (!match || effectiveStatus !== 'live') return
    if (!smTimelineDriving) return
    const s = normalizeScore(initialScoreFromMatch(match))
    setScore(s)
    scoreRef.current = s
    const m = seedMinuteFromMatch(match)
    snapMinuteFromAuthority(m)
  }, [match?.id, match?.minute, match?.score?.home, match?.score?.away, effectiveStatus, smTimelineDriving, snapMinuteFromAuthority])

  /** À chaque refetch `MatchesContext` (~12 s) : réaligner score + minute SM sans réinitialiser tout l’encart. */
  useEffect(() => {
    if (!match || effectiveStatus !== 'live') return
    if (smTimelineDriving) return
    const s = normalizeScore(initialScoreFromMatch(match))
    const m = seedMinuteFromMatch(match)
    setScore(s)
    scoreRef.current = s
    snapMinuteFromAuthority(m)
  }, [match?.id, match?.minute, match?.score?.home, match?.score?.away, smTimelineDriving, snapMinuteFromAuthority])

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
          const g = normalizeScore(goals)
          setScore(g)
          scoreRef.current = g
        }
        const liveMin = extractLiveMinuteFromSmFixture(fx)
        if (Number.isFinite(liveMin) && liveMin > 0) {
          snapMinuteFromAuthority(Math.min(99, liveMin))
        }
        setLiveClockPaused(liveClockPausedFromSmFixture(fx))
        setLiveInSecondHalf(liveSecondHalfFromSmFixture(fx))

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

    const clear = () => {
      if (intervalId) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }
    const arm = () => {
      clear()
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      intervalId = window.setInterval(poll, SM_TIMELINE_POLL_MS)
    }
    const onVis = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState === 'hidden') clear()
      else {
        void poll()
        arm()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis)
      arm()
    } else {
      arm()
    }

    return () => {
      cancelled = true
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis)
      }
      clear()
    }
  }, [active, match?.sportMonksFixtureId, match?.id, clearBumpSoon, flashRim, showToast, snapMinuteFromAuthority])

  useEffect(() => {
    if (!active) return
    if (match?.sportMonksFixtureId && getSportMonksToken()) return
    if (isDemoBarcaPsgShowcaseMatch(match?.id)) {
      let cancelled = false
      const timers: number[] = []
      const pulse = (delay: number, run: () => void) => {
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) run()
          }, delay),
        )
      }
      pulse(2500, () => {
        flashRim('yellow', 650)
        showToast({ kind: 'yellow', text: 'Carton jaune — Vitinha (PSG)', side: 'away' })
      })
      pulse(7000, () => {
        flashRim('goal', 400)
        showToast({ kind: 'chance', text: 'Grosse occasion Barça — Yamal trouve Ferran !' })
      })
      pulse(12_000, () => {
        flashRim('var', 1200)
        setBurst({ kind: 'var', line: 'VAR — hors-jeu parisien vérifié' })
        window.setTimeout(() => {
          if (cancelled) return
          setBurst(null)
          showToast({ kind: 'var_line', text: 'Décision : situation validée' })
        }, 2200)
      })
      pulse(18_000, () => {
        flashRim('yellow', 650)
        showToast({ kind: 'yellow', text: 'Carton jaune — Frenkie de Jong (FCB)', side: 'home' })
      })
      pulse(24_000, () => {
        showToast({
          kind: 'chance',
          text: 'Barcola accélère — Szczesny détourne en corner !',
        })
        flashRim('goal', 400)
      })
      return () => {
        cancelled = true
        for (const t of timers) window.clearTimeout(t)
      }
    }

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

      const prev = normalizeScore(scoreRef.current)
      const total = prev.home + prev.away
      const rng = () => rngRef.current()
      const r = rng()

      if (r < 0.32 && total < 6) {
        const homeBias = prev.home <= prev.away ? 0.52 : 0.45
        const side = rng() < homeBias ? 'home' : 'away'
        const next = { ...prev, [side]: prev[side] + 1 }
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
      liveClockPaused,
      liveInSecondHalf,
    }),
    [active, minute, score, bumpSide, burst, toast, rim, liveClockPaused, liveInSecondHalf],
  )
}
