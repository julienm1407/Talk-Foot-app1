import { handleCapacitorCors } from './corsCapacitor.js'

function decodeInline(id) {
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

async function fetchShare(id) {
  const inline = decodeInline(id)
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

export default async function handler(req, res) {
  if (handleCapacitorCors(req, res, 'GET, OPTIONS')) return
  const host = req.headers.host || 'talk-foot.com'
  const incoming = new URL(req.url || '/', `https://${host}`)
  const id = incoming.searchParams.get('id') || ''
  const payload = id ? await fetchShare(id) : null
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
