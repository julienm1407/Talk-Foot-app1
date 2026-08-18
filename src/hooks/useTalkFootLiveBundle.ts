import { useEffect, useState } from 'react'
import { fetchTalkFootLiveBundleFixture, normalizeSmFixtureIncludes, type SmFixture } from '../api/sportMonks'

type MatchStatus = 'upcoming' | 'live' | 'finished'

type FixtureListener = (fixture: SmFixture | null, settled: boolean) => void

type FixtureChannel = {
  fixture: SmFixture | null
  pollSettled: boolean
  listeners: Set<FixtureListener>
  es: EventSource | null
  pollId: ReturnType<typeof setInterval> | null
  pollMs: number | null
}

const CHANNELS = new Map<number, FixtureChannel>()

function pollMsForStatus(status: MatchStatus): number {
  if (status === 'live') return 5_000
  if (status === 'upcoming') return 20_000
  return 45_000
}

function channelFor(fixtureId: number): FixtureChannel {
  let ch = CHANNELS.get(fixtureId)
  if (!ch) {
    ch = {
      fixture: null,
      pollSettled: false,
      listeners: new Set(),
      es: null,
      pollId: null,
      pollMs: null,
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
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const pollMs = pollMsForStatus(status)

  if (!ch.es && typeof EventSource !== 'undefined' && origin) {
    try {
      const es = new EventSource(`${origin}/api/live-stream?fixtureId=${fixtureId}`)
      es.addEventListener('fixture', (ev) => {
        try {
          const msg = JSON.parse((ev as MessageEvent).data) as { fixture?: SmFixture | null }
          ch.fixture = normalizeSmFixtureIncludes((msg?.fixture as SmFixture | null) ?? null)
          broadcast(ch)
        } catch {
          // ignore parse issues, polling stays active
        }
      })
      es.onerror = () => {
        try {
          es.close()
        } catch {
          // noop
        }
        if (ch.es === es) ch.es = null
      }
      ch.es = es
    } catch {
      ch.es = null
    }
  }

  const runPoll = async () => {
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
}

function maybeStopTransport(fixtureId: number) {
  const ch = CHANNELS.get(fixtureId)
  if (!ch) return
  if (ch.listeners.size > 0) return
  if (ch.es) {
    try {
      ch.es.close()
    } catch {
      // noop
    }
  }
  if (ch.pollId) clearInterval(ch.pollId)
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
