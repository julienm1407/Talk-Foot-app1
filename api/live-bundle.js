/**
 * Agrégateur live TalkFoot (phase 1)
 * - 1 appel SportMonks partagé par fixture (coalescing in-flight)
 * - cache mémoire court (burst guard)
 * - cache Redis optionnel via REST (Upstash-like) si env présente
 *
 * Endpoint:
 *   GET /api/live-bundle?fixtureId=12345
 */

const INFLIGHT = new Map()
const MEM_CACHE = new Map()

const SM_BASE = 'https://api.sportmonks.com/v3/football'
const LIVE_BUNDLE_INCLUDE =
  'participants;league;venue;state;scores;periods;events.type;events.period;events.player;events.relatedPlayer;statistics.type;sidelined.sideline.player;sidelined.sideline.type;weatherReport;comments;lineups.player;lineups.type;lineups.details.type;metadata.type;coaches;formations;trends.type;trends.participant;xGFixture.type'

function nowMs() {
  return Date.now()
}

function ttlSecondsForFixture(fx) {
  const dev = String(fx?.state?.developer_name ?? '').toLowerCase()
  if (dev.includes('live') || dev.includes('inplay')) return 6
  if (dev.includes('finished') || dev.includes('ft')) return 45
  return 20
}

function redisConfig() {
  const url = String(process.env.UPSTASH_REDIS_REST_URL || '').trim()
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  if (!url || !token) return null
  return { url, token }
}

async function redisGetJson(key) {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    })
    if (!res.ok) return null
    const body = await res.json()
    const val = body?.result
    if (typeof val !== 'string' || !val) return null
    return JSON.parse(val)
  } catch {
    return null
  }
}

async function redisSetJson(key, value, ttlSec) {
  const cfg = redisConfig()
  if (!cfg) return
  try {
    const payload = encodeURIComponent(JSON.stringify(value))
    await fetch(`${cfg.url}/setex/${encodeURIComponent(key)}/${Math.max(1, ttlSec)}/${payload}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` },
    })
  } catch {
    // fail-open: cache Redis optionnel
  }
}

async function fetchSportMonksFixture(token, fixtureId) {
  const upstream = new URL(`${SM_BASE}/fixtures/${fixtureId}`)
  upstream.searchParams.set('include', LIVE_BUNDLE_INCLUDE)
  upstream.searchParams.set('timezone', 'Europe/Paris')

  const res = await fetch(upstream.toString(), {
    headers: { Authorization: token },
    cache: 'no-store',
  })
  const text = await res.text()
  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }
  if (!res.ok) {
    const msg = body?.message ? String(body.message) : text.slice(0, 160)
    throw new Error(`SportMonks ${res.status}: ${msg}`)
  }
  return body
}

function pickFixture(envelope) {
  const data = envelope?.data
  if (!data) return null
  if (Array.isArray(data)) return data[0] ?? null
  if (typeof data === 'object') return data
  return null
}

async function loadLiveBundle(token, fixtureId) {
  const key = `live-bundle:${fixtureId}`
  const cached = MEM_CACHE.get(key)
  if (cached && cached.expireAt > nowMs()) return cached.payload

  const redisCached = await redisGetJson(key)
  if (redisCached) {
    MEM_CACHE.set(key, { payload: redisCached, expireAt: nowMs() + 4_000 })
    return redisCached
  }

  const envelope = await fetchSportMonksFixture(token, fixtureId)
  const fixture = pickFixture(envelope)
  const ttlSec = ttlSecondsForFixture(fixture)
  const payload = {
    fixture,
    meta: {
      source: 'sportmonks-live-bundle',
      fixtureId,
      fetchedAt: new Date().toISOString(),
      ttlSec,
    },
  }

  MEM_CACHE.set(key, { payload, expireAt: nowMs() + ttlSec * 1000 })
  await redisSetJson(key, payload, ttlSec)
  return payload
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method Not Allowed')
    return
  }

  const token = String(process.env.SPORTMONKS_TOKEN || process.env.VITE_SPORTMONKS_TOKEN || '').trim()
  if (!token) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'Missing SPORTMONKS_TOKEN for /api/live-bundle' }))
    return
  }

  const host = req.headers.host || 'localhost'
  const incoming = new URL(req.url || '/', `https://${host}`)
  const fixtureIdRaw = incoming.searchParams.get('fixtureId')
  const fixtureId = Number(fixtureIdRaw)
  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'Invalid fixtureId' }))
    return
  }

  const inflightKey = String(fixtureId)
  let p = INFLIGHT.get(inflightKey)
  if (!p) {
    p = loadLiveBundle(token, fixtureId).finally(() => {
      if (INFLIGHT.get(inflightKey) === p) INFLIGHT.delete(inflightKey)
    })
    INFLIGHT.set(inflightKey, p)
  }

  try {
    const payload = await p
    const ttl = Math.max(2, Number(payload?.meta?.ttlSec) || 6)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${Math.max(2 * ttl, 12)}`)
    res.end(JSON.stringify(payload))
  } catch (e) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        message: e instanceof Error ? e.message : 'Live bundle upstream error',
      }),
    )
  }
}

