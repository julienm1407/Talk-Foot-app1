/**
 * Ancien SSE live. Sur Hobby, une connexion ouverte = CPU Fluid facturé
 * pendant toute la durée du match (quota 4 h / 30 j). Désactivé : le client
 * poll `/api/live-bundle` (CDN s-maxage).
 *
 * 410 + cache long : les vieux EventSource se reconnectent sans réveiller
 * d’instance à chaque tentative.
 */
export default function handler(req, res) {
  res.statusCode = 410
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400')
  res.end(JSON.stringify({ error: 'sse_disabled', use: '/api/live-bundle' }))
}
