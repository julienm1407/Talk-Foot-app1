/** Origines WebView Capacitor autorisées à appeler /api/* en cross-origin. */
const CAPACITOR_ORIGINS = new Set([
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
])

export function applyCapacitorCorsHeaders(req, res) {
  const origin = req.headers.origin
  if (origin && CAPACITOR_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
}

/** Répond aux preflight OPTIONS ; applique les en-têtes CORS sur toutes les requêtes. */
export function handleCapacitorCors(req, res) {
  applyCapacitorCorsHeaders(req, res)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}
