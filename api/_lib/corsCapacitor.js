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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
}

/** Répond aux preflight OPTIONS ; applique les en-têtes CORS sur toutes les requêtes. */
export function handleCapacitorCors(req, res, methods = 'GET, OPTIONS') {
  applyCapacitorCorsHeaders(req, res)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', methods)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}
