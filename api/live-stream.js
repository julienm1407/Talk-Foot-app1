/**
 * SSE live stream TalkFoot par fixture.
 *
 * Endpoint:
 *   GET /api/live-stream?fixtureId=12345
 *
 * Notes:
 * - pousse un snapshot initial puis des updates périodiques
 * - s'appuie sur /api/live-bundle (cache + coalescing déjà en place)
 */

function nowIso() {
  return new Date().toISOString()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method Not Allowed')
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

  const proto = String(req.headers['x-forwarded-proto'] || 'https')
  const base = `${proto}://${host}`
  const bundleUrl = `${base}/api/live-bundle?fixtureId=${fixtureId}`

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  let closed = false
  let lastPayload = ''

  const sendEvent = (event, payload) => {
    if (closed) return
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  const tick = async () => {
    if (closed) return
    try {
      const upstream = await fetch(bundleUrl, { cache: 'no-store' })
      if (!upstream.ok) {
        sendEvent('error', { at: nowIso(), status: upstream.status })
        return
      }
      const body = await upstream.json()
      const payload = {
        fixture: body?.fixture ?? null,
        meta: {
          ...body?.meta,
          streamedAt: nowIso(),
        },
      }
      const text = JSON.stringify(payload)
      if (text === lastPayload) return
      lastPayload = text
      sendEvent('fixture', payload)
    } catch {
      sendEvent('error', { at: nowIso(), status: 0 })
    }
  }

  sendEvent('ready', { fixtureId, at: nowIso() })
  await tick()
  const intervalId = setInterval(() => {
    void tick()
  }, 6_000)
  const heartbeatId = setInterval(() => {
    if (closed) return
    res.write(': ping\n\n')
  }, 20_000)

  req.on('close', () => {
    closed = true
    clearInterval(intervalId)
    clearInterval(heartbeatId)
    try {
      res.end()
    } catch {
      // ignore close race
    }
  })
}

