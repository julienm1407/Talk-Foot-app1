/**
 * Cache partagé Vercel CDN : 1 000 fans d’un même salon = 1 origine / TTL,
 * grâce à s-maxage + stale-while-revalidate (un seul refresh, les autres
 * reçoivent le stale).
 */
export function applyCdnCache(res, sMaxAge, swr) {
  const s = Math.max(1, Math.floor(sMaxAge))
  const r = Math.max(s, Math.floor(swr ?? s * 6))
  const staleErr = Math.max(r, 60)
  const forBrowser = `public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=${r}, stale-if-error=${staleErr}`
  const forCdn = `public, s-maxage=${s}, stale-while-revalidate=${r}, stale-if-error=${staleErr}`
  res.setHeader('Cache-Control', forBrowser)
  res.setHeader('CDN-Cache-Control', forCdn)
  res.setHeader('Vercel-CDN-Cache-Control', forCdn)
}
