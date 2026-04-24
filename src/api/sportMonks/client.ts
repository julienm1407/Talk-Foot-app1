const SM_BASE_REMOTE = 'https://api.sportmonks.com/v3/football'

/** URL absolue d’appel : en `vite dev`, proxy same-origin `/sm-api` → `api.sportmonks.com/v3/football`. */
function sportMonksRequestHref(pathWithLeadingSlash: string): string {
  if (import.meta.env.DEV && typeof globalThis !== 'undefined' && 'location' in globalThis) {
    const o = (globalThis as { location?: { origin?: string } }).location?.origin
    if (o) return `${o}/sm-api${pathWithLeadingSlash}`
  }
  return `${SM_BASE_REMOTE}${pathWithLeadingSlash}`
}

export type SportMonksListEnvelope<T> = {
  data: T
  pagination?: {
    has_more?: boolean
    current_page?: number
    total_pages?: number
    count?: number
    per_page?: number
  }
  message?: string
}

/**
 * Appels SportMonks v3. Jeton : `VITE_SPORTMONKS_TOKEN` au build ou page `/settings/donnees` (localStorage).
 * Header `Authorization` = valeur brute du token (sans « Bearer »).
 * @see https://docs.sportmonks.com/football/welcome/authentication
 */
export async function sportMonksFetchJson<T>(
  pathWithLeadingSlash: string,
  token: string,
  search?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(sportMonksRequestHref(pathWithLeadingSlash))
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  // Dates / `starting_at` cohérents avec le calendrier français (fixtures/between, etc.)
  if (!url.searchParams.has('timezone')) {
    url.searchParams.set('timezone', 'Europe/Paris')
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: token },
    /** Évite un snapshot « figé » si le navigateur réutilise une réponse GET en cache. */
    cache: 'no-store',
  })
  const text = await res.text()
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error(`SportMonks ${res.status}: réponse non JSON (${text.slice(0, 120)})`)
  }
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: string }).message)
        : text.slice(0, 200)
    throw new Error(`SportMonks ${res.status}: ${msg}`)
  }
  return body as T
}

export function sportMonksPaginationHasMore(
  json: SportMonksListEnvelope<unknown>,
  pageSize: number,
  chunkLength: number,
): boolean {
  const p = json.pagination
  if (p?.has_more === true) return true
  if (p?.has_more === false) return false
  const cur = p?.current_page
  const tot = p?.total_pages
  if (typeof cur === 'number' && typeof tot === 'number' && tot > 0) return cur < tot
  return chunkLength >= pageSize
}
