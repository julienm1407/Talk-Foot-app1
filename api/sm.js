/**
 * Relais SportMonks (Vercel serverless, runtime).
 * Le client appelle GET /api/sm?__sm_path=/fixtures/inplay&include=…
 * La clé API est lue ici : SPORTMONKS_TOKEN ou VITE_SPORTMONKS_TOKEN (Project → Environment Variables).
 */
import { handleCapacitorCors } from './_lib/corsCapacitor.js'
import { scheduleLivePushNudge } from './push-kickoff.mjs'

function decodeInlineProno(id) {
  if (!id || !String(id).startsWith('b.')) return null
  try {
    const pad = String(id).slice(2).replace(/-/g, '+').replace(/_/g, '/')
    const padded = pad + '==='.slice((pad.length + 3) % 4)
    const json = decodeURIComponent(escape(Buffer.from(padded, 'base64').toString('utf8')))
    const parsed = JSON.parse(json)
    if (parsed?.v !== 1 || !parsed.matchId) return null
    return parsed
  } catch {
    return null
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchPronoShare(id) {
  const inline = decodeInlineProno(id)
  if (inline) return inline
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '')
  if (!url || !key) return null
  const res = await fetch(`${url}/rest/v1/prono_shares?id=eq.${encodeURIComponent(id)}&select=payload`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0]?.payload ?? null
}

async function sendPronoOgHtml(res, id) {
  const payload = id ? await fetchPronoShare(id) : null
  const pageUrl = `https://talk-foot.com/p/${encodeURIComponent(id)}`
  const title = payload
    ? `${payload.displayName} a dit ${payload.outcome} ${payload.team || ''} — Talk Foot`
    : 'Prono Talk Foot'
  const desc = payload?.invite || 'Fais ton prono sur Talk Foot. Gratuit, entre supporters.'
  const image = payload?.ogImageUrl || payload?.storyImageUrl || 'https://talk-foot.com/logo-talk-foot.png'
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />
</head>
<body>
  <p><a href="${escapeHtml(pageUrl)}">Ouvrir le prono Talk Foot</a></p>
</body>
</html>`
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.end(html)
}

export default async function handler(req, res) {
  if (handleCapacitorCors(req, res)) return

  const hostEarly = req.headers.host || 'localhost'
  const incomingEarly = new URL(req.url || '/', `https://${hostEarly}`)
  if (incomingEarly.searchParams.get('__og') === 'prono') {
    await sendPronoOgHtml(res, incomingEarly.searchParams.get('id') || '')
    return
  }

  const token = String(process.env.SPORTMONKS_TOKEN || process.env.VITE_SPORTMONKS_TOKEN || '').trim()
  if (!token) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        message:
          'SportMonks: aucune clé serveur. Ajoute SPORTMONKS_TOKEN ou VITE_SPORTMONKS_TOKEN sur Vercel (Production), puis redeploy.',
      }),
    )
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method Not Allowed')
    return
  }

  const host = req.headers.host || 'localhost'
  const incoming = new URL(req.url || '/', `https://${host}`)
  const smPath = incoming.searchParams.get('__sm_path') || ''
  if (!smPath.startsWith('/') || smPath.includes('..')) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'Paramètre __sm_path invalide' }))
    return
  }

  incoming.searchParams.delete('__sm_path')
  const upstream = new URL(`https://api.sportmonks.com/v3/football${smPath}`)
  incoming.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value)
  })
  if (!upstream.searchParams.has('timezone')) {
    upstream.searchParams.set('timezone', 'Europe/Paris')
  }

  function cachePolicyForPath(pathname) {
    // Cache partagé CDN (s-maxage) : plusieurs visiteurs = moins d’appels vers api.sportmonks.com.
    if (pathname.startsWith('/livescores/inplay')) return 'public, s-maxage=30, stale-while-revalidate=60'
    if (pathname.startsWith('/fixtures/')) return 'public, s-maxage=45, stale-while-revalidate=90'
    if (pathname.startsWith('/rounds/')) return 'public, s-maxage=60, stale-while-revalidate=120'
    if (pathname.startsWith('/leagues/date/')) return 'public, s-maxage=300, stale-while-revalidate=600'
    if (pathname.startsWith('/standings/')) return 'public, s-maxage=180, stale-while-revalidate=360'
    if (pathname.startsWith('/schedules/')) return 'public, s-maxage=120, stale-while-revalidate=240'
    if (pathname.startsWith('/teams/')) return 'public, s-maxage=120, stale-while-revalidate=240'
    if (pathname.startsWith('/squads/')) return 'public, s-maxage=300, stale-while-revalidate=600'
    return 'public, s-maxage=60, stale-while-revalidate=120'
  }

  try {
    const smRes = await fetch(upstream.toString(), {
      headers: { Authorization: token },
      cache: 'no-store',
    })
    const text = await smRes.text()
    const ct = smRes.headers.get('content-type') || 'application/json; charset=utf-8'
    res.statusCode = smRes.status
    res.setHeader('Content-Type', ct)
    if (smRes.status >= 200 && smRes.status < 300) {
      res.setHeader('Cache-Control', cachePolicyForPath(smPath))
      if (smPath.includes('livescores/inplay') || smPath.includes('fixtures/inplay')) {
        try {
          const payload = JSON.parse(text)
          const fixtures = Array.isArray(payload?.data) ? payload.data : []
          scheduleLivePushNudge(fixtures)
        } catch {
          /* ignore */
        }
      }
    } else {
      res.setHeader('Cache-Control', 'no-store')
    }
    res.end(text)
  } catch (e) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        message: e instanceof Error ? `SportMonks relay error: ${e.message}` : 'SportMonks relay error',
      }),
    )
  }
}
