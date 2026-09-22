import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { handleCapacitorCors } from './corsCapacitor.js'

const LEAD_MS = 15 * 60 * 1000
const WINDOW_MS = 8 * 60 * 1000

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

/**
 * GET/POST — envoie les pop-up FCM T−15 min (clubs favoris).
 * Auth : Bearer CRON_SECRET (Vercel Cron ou cron-job.org).
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

  const now = Date.now()
  const from = new Date(now + LEAD_MS - WINDOW_MS).toISOString()
  const to = new Date(now + LEAD_MS + WINDOW_MS).toISOString()

  const { data: watches, error: watchErr } = await sb
    .from('match_kickoff_watches')
    .select('user_id, match_id, title, body, href, kickoff_at')
    .gte('kickoff_at', from)
    .lte('kickoff_at', to)

  if (watchErr) {
    json(res, 500, { ok: false, error: watchErr.message })
    return
  }

  const rows = watches ?? []
  if (rows.length === 0) {
    json(res, 200, { ok: true, sent: 0, skipped: 0 })
    return
  }

  const { data: logs } = await sb
    .from('match_kickoff_push_log')
    .select('user_id, match_id')
    .eq('kind', 't15')
    .in(
      'match_id',
      rows.map((r) => r.match_id),
    )

  const already = new Set((logs ?? []).map((l) => `${l.user_id}:${l.match_id}`))
  const pending = rows.filter((r) => !already.has(`${r.user_id}:${r.match_id}`))
  const userIds = [...new Set(pending.map((r) => r.user_id))]

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

  let accessToken
  try {
    accessToken = await googleAccessToken(sa)
  } catch (e) {
    json(res, 500, { ok: false, error: e instanceof Error ? e.message : 'fcm_oauth' })
    return
  }

  let sent = 0
  let skipped = rows.length - pending.length
  const stale = []

  for (const watch of pending) {
    const deviceTokens = tokensByUser.get(watch.user_id) ?? []
    if (deviceTokens.length === 0) {
      skipped += 1
      continue
    }
    let delivered = false
    for (const token of deviceTokens) {
      const result = await sendFcm(sa, accessToken, token, watch.title, watch.body, watch.href)
      if (result.stale) stale.push(token)
      if (result.ok) delivered = true
    }
    if (delivered) {
      sent += 1
      await sb.from('match_kickoff_push_log').upsert(
        {
          user_id: watch.user_id,
          match_id: watch.match_id,
          kind: 't15',
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,match_id,kind' },
      )
    }
  }

  if (stale.length > 0) {
    await sb.from('push_device_tokens').delete().in('token', stale)
  }

  json(res, 200, { ok: true, sent, skipped, stale: stale.length })
}
