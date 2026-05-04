/**
 * Relais SportMonks (Vercel serverless, runtime).
 * Le client appelle GET /api/sm?__sm_path=/fixtures/inplay&include=…
 * La clé API est lue ici : SPORTMONKS_TOKEN ou VITE_SPORTMONKS_TOKEN (Project → Environment Variables).
 */
export default async function handler(req, res) {
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
