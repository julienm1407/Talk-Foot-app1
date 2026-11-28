import { useEffect, useState } from 'react'
import { fetchTalkFootLiveBundleFixture, type SmFixture } from '../api/sportMonks'

type MatchStatus = 'upcoming' | 'live' | 'finished'

type FixtureListener = (fixture: SmFixture | null, settled: boolean) => void

type FixtureChannel = {
  fixture: SmFixture | null
  pollSettled: boolean
  listeners: Set<FixtureListener>
  pollId: ReturnType<typeof setInterval> | null
  pollMs: number | null
  onVis: (() => void) | null
}

const CHANNELS = new Map<number, FixtureChannel>()

/** Aligné sur s-maxage live-bundle : le chrono UI tick à 1 s, SM toutes les 5 s. */
function pollMsForStatus(status: MatchStatus): number {
  if (status === 'live') return 5_000
  if (status === 'upcoming') return 20_000
  return 60_000
}

function channelFor(fixtureId: number): FixtureChannel {
  let ch = CHANNELS.get(fixtureId)
  if (!ch) {
    ch = {
      fixture: null,
      pollSettled: false,
      listeners: new Set(),
      pollId: null,
      pollMs: null,
      onVis: null,
    }
    CHANNELS.set(fixtureId, ch)
  }
  return ch
}

function broadcast(ch: FixtureChannel) {
  for (const l of ch.listeners) l(ch.fixture, ch.pollSettled)
}

function ensureTransport(fixtureId: number, status: MatchStatus) {
  const ch = channelFor(fixtureId)
  const pollMs = pollMsForStatus(status)

  const runPoll = async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    try {
      const fx = await fetchTalkFootLiveBundleFixture(fixtureId)
      if (fx) ch.fixture = fx
    } finally {
      ch.pollSettled = true
      broadcast(ch)
    }
  }

  if (ch.pollId != null && ch.pollMs !== pollMs) {
    clearInterval(ch.pollId)
    ch.pollId = null
    ch.pollMs = null
  }

  if (!ch.pollId) {
    void runPoll()
    ch.pollMs = pollMs
    ch.pollId = setInterval(() => {
      void runPoll()
    }, pollMs)
  }

  if (!ch.onVis && typeof document !== 'undefined') {
    ch.onVis = () => {
      if (document.visibilityState === 'visible') void runPoll()
    }
    document.addEventListener('visibilitychange', ch.onVis)
  }
}

function maybeStopTransport(fixtureId: number) {
  const ch = CHANNELS.get(fixtureId)
  if (!ch) return
  if (ch.listeners.size > 0) return
  if (ch.pollId) clearInterval(ch.pollId)
  if (ch.onVis && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', ch.onVis)
  }
  CHANNELS.delete(fixtureId)
}

export function useTalkFootLiveBundle(fixtureId: number | undefined, matchStatus: MatchStatus) {
  const [fixture, setFixture] = useState<SmFixture | null>(null)
  const [liveBundleSettled, setLiveBundleSettled] = useState(false)

  useEffect(() => {
    if (!fixtureId || !Number.isFinite(fixtureId)) {
      setFixture(null)
      setLiveBundleSettled(false)
      return
    }
    const ch = channelFor(fixtureId)
    const listener: FixtureListener = (fx, settled) => {
      setFixture(fx)
      setLiveBundleSettled(settled)
    }
    ch.listeners.add(listener)
    setFixture(ch.fixture)
    setLiveBundleSettled(ch.pollSettled)
    ensureTransport(fixtureId, matchStatus)

    return () => {
      ch.listeners.delete(listener)
      maybeStopTransport(fixtureId)
    }
  }, [fixtureId, matchStatus])

  return { liveBundleFixture: fixture, liveBundleSettled }
}
