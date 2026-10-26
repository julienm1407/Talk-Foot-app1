import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { handleCapacitorCors } from './corsCapacitor.js'

const T60_LEAD_MS = 60 * 60 * 1000
const WINDOW_MS = 12 * 60 * 1000
const KICKOFF_BEFORE_MS = 2 * 60 * 1000
const KICKOFF_AFTER_MS = 10 * 60 * 1000
const MAX_FCM_PER_RUN = 80

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function parseServiceAccount() {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function b64url(value) {
  return Buffer.from(value).toString('base64url')
}

async function googleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    }),
  )
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const jwt = `${header}.${claim}.${signer.sign(sa.private_key, 'base64url')}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('fcm_oauth_failed')
  return data.access_token
}

async function sendFcm(sa, accessToken, token, title, body, href) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { href: String(href ?? '/') },
          android: {
            priority: 'HIGH',
            notification: {
              channel_id: 'talkfoot-match',
              notification_count: 1,
            },
          },
        },
      }),
    },
  )
  if (res.status === 404 || res.status === 410) return { stale: true }
  if (!res.ok) {
    const text = await res.text()
    return { error: text.slice(0, 300) }
  }
  return { ok: true }
}

function authorized(req) {
  const secret = process.env.CRON_SECRET?.trim() || process.env.PUSH_CRON_SECRET?.trim()
  if (!secret) return false
  const header = String(req.headers.authorization ?? '')
  if (header === `Bearer ${secret}`) return true
  const url = new URL(req.url || '/', 'http://localhost')
  return url.searchParams.get('secret') === secret
}

function sportMonksToken() {
  return String(process.env.SPORTMONKS_TOKEN || process.env.VITE_SPORTMONKS_TOKEN || '').trim()
}

function classifyLiveEvent(ev) {
  const type = ev?.type && typeof ev.type === 'object' ? ev.type : {}
  const dev = String(type.developer_name ?? type.name ?? ev?.info ?? '').toUpperCase()
  if (!dev) return null
  if (dev.includes('SUBSTITUTION') || dev.includes('SUBS')) return null
  if (dev.includes('GOALKICK') || dev.includes('GOAL KICK') || dev.includes('GOALKEEPER')) return null
  if (
    dev.includes('DISALLOWED') ||
    dev.includes('CANCELLED') ||
    dev.includes('CANCELED') ||
    dev.includes('NO GOAL')
  ) {
    return null
  }
  const own = /OWN.?GOAL/.test(dev) || /OWNGOAL/.test(dev)
  const isGoal =
    own ||
    ((/\bGOAL\b/.test(dev) || /\bGOL\b/.test(dev)) && !dev.includes('CARD') && !dev.includes('KICK'))
  const isCard =
    /YELLOW/.test(dev) ||
    /REDCARD/.test(dev) ||
    /RED_CARD/.test(dev) ||
    (dev.includes('RED') && dev.includes('CARD'))
  if (!isGoal && !isCard) return null
  const player = String(ev.player?.display_name ?? ev.player?.name ?? ev.player_name ?? '').trim()
  const minute = typeof ev.minute === 'number' ? ev.minute : 0
  const extra = typeof ev.extra_minute === 'number' ? ev.extra_minute : 0
  const minLabel = extra > 0 ? `${minute}+${extra}` : String(minute || '')
  const eventId = typeof ev.id === 'number' && ev.id > 0 ? String(ev.id) : `${dev}:${minute}:${player}`
  if (isGoal) {
    return {
      kind: `g:${eventId}`.slice(0, 80),
      body: own
        ? `${minLabel ? `${minLabel}’ · ` : ''}CSC${player ? ` — ${player}` : ''}`
        : `${minLabel ? `${minLabel}’ · ` : ''}BUT${player ? ` — ${player}` : ''}`,
    }
  }
  const red = /RED/.test(dev) && !/YELLOW/.test(dev)
  const second = /SECOND/.test(dev)
  return {
    kind: `c:${eventId}`.slice(0, 80),
    body: `${minLabel ? `${minLabel}’ · ` : ''}${second || red ? 'Carton rouge' : 'Carton jaune'}${
      player ? ` — ${player}` : ''
    }`,
  }
}

function fixtureTitle(fx) {
  const parts = Array.isArray(fx.participants) ? fx.participants : []
  const home = parts.find((p) => p?.meta?.location === 'home') ?? parts[0]
  const away = parts.find((p) => p?.meta?.location === 'away') ?? parts[1]
  const hn = String(home?.short_code ?? home?.name ?? 'Domicile').trim()
  const an = String(away?.short_code ?? away?.name ?? 'Extérieur').trim()
  return `${hn} – ${an}`
}

function currentScoreLabel(fx) {
  const scores = Array.isArray(fx.scores) ? fx.scores : []
  const current = scores.filter((s) => String(s?.description ?? '').toUpperCase() === 'CURRENT')
  let home = null
  let away = null
  for (const row of current) {
    const side = String(row?.score?.participant ?? '').toLowerCase()
    const g = row?.score?.goals
    if (typeof g !== 'number') continue
    if (side === 'home') home = g
    if (side === 'away') away = g
  }
  if (home == null || away == null) return ''
  return ` ${home}-${away}`
}

async function loadTokensByUser(sb, userIds) {
  const { data: tokens } = await sb
    .from('push_device_tokens')
    .select('token, user_id')
    .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
  const tokensByUser = new Map()
  for (const t of tokens ?? []) {
    const list = tokensByUser.get(t.user_id) ?? []
    list.push(t.token)
    tokensByUser.set(t.user_id, list)
  }
  return tokensByUser
}

async function alreadySentSet(sb, kind, matchIds) {
  if (matchIds.length === 0) return new Set()
  const { data: logs } = await sb
    .from('match_kickoff_push_log')
    .select('user_id, match_id')
    .eq('kind', kind)
    .in('match_id', matchIds)
  return new Set((logs ?? []).map((l) => `${l.user_id}:${l.match_id}`))
}

async function deliverWatch(sb, sa, accessToken, tokensByUser, stale, watch, title, body, kind) {
  const deviceTokens = tokensByUser.get(watch.user_id) ?? []
  if (deviceTokens.length === 0) return { sent: false, skipped: true }
  let delivered = false
  for (const token of deviceTokens) {
    const result = await sendFcm(sa, accessToken, token, title, body, watch.href)
    if (result.stale) stale.push(token)
    if (result.ok) delivered = true
  }
  if (delivered) {
    await sb.from('match_kickoff_push_log').upsert(
      {
        user_id: watch.user_id,
        match_id: watch.match_id,
        kind,
        sent_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id,kind' },
    )
  }
  return { sent: delivered, skipped: !delivered }
}

async function sendKickoffWindow(sb, sa, accessToken, stale, now, kind, fromIso, toIso, bodyFor) {
  const { data: watches, error: watchErr } = await sb
    .from('match_kickoff_watches')
    .select('user_id, match_id, title, href, kickoff_at')
    .gte('kickoff_at', fromIso)
    .lte('kickoff_at', toIso)

  if (watchErr) throw new Error(watchErr.message)
  const rows = watches ?? []
  if (rows.length === 0) return { sent: 0, skipped: 0 }

  const already = await alreadySentSet(sb, kind, rows.map((r) => r.match_id))
  const pending = rows.filter((r) => !already.has(`${r.user_id}:${r.match_id}`))
  const tokensByUser = await loadTokensByUser(sb, [...new Set(pending.map((r) => r.user_id))])

  let sent = 0
  let skipped = rows.length - pending.length
  for (const watch of pending) {
    if (sent >= MAX_FCM_PER_RUN) break
    const body = bodyFor(watch)
    const result = await deliverWatch(
      sb,
      sa,
      accessToken,
      tokensByUser,
      stale,
      watch,
      watch.title,
      body,
      kind,
    )
    if (result.sent) sent += 1
    else skipped += 1
  }
  return { sent, skipped }
}

async function sendLiveEvents(sb, sa, accessToken, stale, now) {
  const smToken = sportMonksToken()
  if (!smToken) return { sent: 0, skipped: 0, reason: 'no_sm_token' }

  const { data: watches } = await sb
    .from('match_kickoff_watches')
    .select('user_id, match_id, title, href, kickoff_at')
    .gte('kickoff_at', new Date(now - 3.5 * 60 * 60 * 1000).toISOString())
    .lte('kickoff_at', new Date(now + 8 * 60 * 1000).toISOString())

  const rows = watches ?? []
  if (rows.length === 0) return { sent: 0, skipped: 0 }

  const wanted = new Map()
  for (const w of rows) {
    const list = wanted.get(w.match_id) ?? []
    list.push(w)
    wanted.set(w.match_id, list)
  }

  const upstream = new URL('https://api.sportmonks.com/v3/football/livescores/inplay')
  upstream.searchParams.set('include', 'participants;scores;events.player;events.type;state')
  upstream.searchParams.set('timezone', 'Europe/Paris')

  const smRes = await fetch(upstream.toString(), {
    headers: { Authorization: smToken },
    cache: 'no-store',
  })
  if (!smRes.ok) return { sent: 0, skipped: 0, reason: `sm_${smRes.status}` }
  const payload = await smRes.json()
  const fixtures = Array.isArray(payload?.data) ? payload.data : []

  const jobs = []
  for (const fx of fixtures) {
    if (typeof fx?.id !== 'number') continue
    const matchId = `m-sm-${fx.id}`
    const watchers = wanted.get(matchId)
    if (!watchers?.length) continue
    const events = Array.isArray(fx.events) ? fx.events : []
    const title = fixtureTitle(fx)
    const score = currentScoreLabel(fx)
    for (const ev of events) {
      const classified = classifyLiveEvent(ev)
      if (!classified) continue
      for (const watch of watchers) {
        jobs.push({
          watch,
          kind: classified.kind,
          title: `${title}${score}`,
          body: classified.body,
        })
      }
    }
  }

  if (jobs.length === 0) return { sent: 0, skipped: 0 }

  const kinds = [...new Set(jobs.map((j) => j.kind))]
  const matchIds = [...new Set(jobs.map((j) => j.watch.match_id))]
  const { data: logs } = await sb
    .from('match_kickoff_push_log')
    .select('user_id, match_id, kind')
    .in('match_id', matchIds)
    .in('kind', kinds.slice(0, 200))

  const already = new Set((logs ?? []).map((l) => `${l.user_id}:${l.match_id}:${l.kind}`))
  const pending = jobs.filter((j) => !already.has(`${j.watch.user_id}:${j.watch.match_id}:${j.kind}`))
  const tokensByUser = await loadTokensByUser(sb, [...new Set(pending.map((j) => j.watch.user_id))])

  let sent = 0
  let skipped = jobs.length - pending.length
  for (const job of pending) {
    if (sent >= MAX_FCM_PER_RUN) break
    const result = await deliverWatch(
      sb,
      sa,
      accessToken,
      tokensByUser,
      stale,
      job.watch,
      job.title,
      job.body,
      job.kind,
    )
    if (result.sent) sent += 1
    else skipped += 1
  }
  return { sent, skipped }
}

/**
 * GET/POST — FCM 1 h avant, coup d’envoi, puis buts/cartons en live.
 * Auth : Bearer CRON_SECRET (Vercel Cron ou cron-job.org toutes les 5–10 min).
 */
export default async function handler(req, res) {
  if (handleCapacitorCors(req, res, 'GET, POST, OPTIONS')) return
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    res.end('Method Not Allowed')
    return
  }
  if (!authorized(req)) {
    json(res, 401, { ok: false, error: 'unauthorized' })
    return
  }

  const sb = getSupabaseAdmin()
  const sa = parseServiceAccount()
  if (!sb) {
    json(res, 500, { ok: false, error: 'supabase_admin_missing' })
    return
  }
  if (!sa?.project_id || !sa?.private_key || !sa?.client_email) {
    json(res, 500, { ok: false, error: 'fcm_service_account_missing' })
    return
  }

  let accessToken
  try {
    accessToken = await googleAccessToken(sa)
  } catch (e) {
    json(res, 500, { ok: false, error: e instanceof Error ? e.message : 'fcm_oauth' })
    return
  }

  const now = Date.now()
  const stale = []
  let t60
  let kickoff
  let live
  try {
    t60 = await sendKickoffWindow(
      sb,
      sa,
      accessToken,
      stale,
      now,
      't60',
      new Date(now + T60_LEAD_MS - WINDOW_MS).toISOString(),
      new Date(now + T60_LEAD_MS + WINDOW_MS).toISOString(),
      () => 'Coup d’envoi dans 1 h — ouvre la tribune Talk Foot.',
    )
    kickoff = await sendKickoffWindow(
      sb,
      sa,
      accessToken,
      stale,
      now,
      'kickoff',
      new Date(now - KICKOFF_AFTER_MS).toISOString(),
      new Date(now + KICKOFF_BEFORE_MS).toISOString(),
      () => 'C’est parti — le match commence.',
    )
    live = await sendLiveEvents(sb, sa, accessToken, stale, now)
  } catch (e) {
    json(res, 500, { ok: false, error: e instanceof Error ? e.message : 'push_failed' })
    return
  }

  if (stale.length > 0) {
    await sb.from('push_device_tokens').delete().in('token', stale)
  }

  json(res, 200, {
    ok: true,
    t60,
    kickoff,
    live,
    stale: stale.length,
  })
}
