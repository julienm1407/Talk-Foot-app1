import { TF_SM_SERVER_RELAY_PLACEHOLDER } from '../../utils/apiTokens'
import { getTalkFootApiOrigin } from '../../utils/sportMonksRelayOrigin'
import { LS_KEY_SPORTMONKS_TOKEN } from '../../constants/apiKeysStorage'
import { sortSearchParamsForStableCaching } from '../../utils/sportMonksRequestUtils'

const SM_BASE_REMOTE = 'https://api.sportmonks.com/v3/football'

/**
 * Appel direct SM (jeton dans le navigateur) : en `vite dev`, proxy `/sm-api` → `api.sportmonks.com/v3/football`.
 * Si tout passe par le relais (`TF_SM_SERVER_RELAY_PLACEHOLDER`), `buildSmRequestUrl` utilise `/api/sm` à la place.
 */
function sportMonksRequestHref(pathWithLeadingSlash: string): string {
  if (import.meta.env.DEV && typeof globalThis !== 'undefined' && 'location' in globalThis) {
    const o = (globalThis as { location?: { origin?: string } }).location?.origin
    if (o) return `${o}/sm-api${pathWithLeadingSlash}`
  }
  return `${SM_BASE_REMOTE}${pathWithLeadingSlash}`
}

function buildSmRequestUrl(
  pathWithLeadingSlash: string,
  search: Record<string, string | number | boolean | undefined> | undefined,
  viaServerRelay: boolean,
): URL {
  let u: URL
  if (viaServerRelay) {
    u = new URL(`${getTalkFootApiOrigin()}/api/sm`)
    u.searchParams.set('__sm_path', pathWithLeadingSlash)
  } else {
    u = new URL(sportMonksRequestHref(pathWithLeadingSlash))
  }
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      if (v !== undefined) u.searchParams.set(k, String(v))
    }
  }
  if (!u.searchParams.has('timezone')) {
    u.searchParams.set('timezone', 'Europe/Paris')
  }
  sortSearchParamsForStableCaching(u)
  return u
}

/** Requêtes identiques en parallèle → une seule montée réseau (réduit pics quota). */
const smInflightJson = new Map<string, Promise<unknown>>()

function readBrowserSportMonksToken(): string | null {
  try {
    const v = localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN)
    const t = typeof v === 'string' ? v.trim() : ''
    return t || null
  } catch {
    return null
  }
}

async function fetchJsonBody(url: string, headers: Record<string, string>): Promise<{
  ok: boolean
  status: number
  text: string
  body: unknown
}> {
  const res = await fetch(url, { headers, cache: 'no-store' })
  const text = await res.text()
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error(`SportMonks ${res.status}: réponse non JSON (${text.slice(0, 120)})`)
  }
  return { ok: res.ok, status: res.status, text, body }
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
 * Appels SportMonks v3.
 * Jeton : `VITE_SPORTMONKS_TOKEN` (build), localStorage, ou sur Vercel relais `/api/sm` + `SPORTMONKS_TOKEN` / `VITE_SPORTMONKS_TOKEN` côté serveur.
 * Header `Authorization` = valeur brute du token (sans « Bearer »), sauf relais où le serveur signe la requête.
 * @see https://docs.sportmonks.com/football/welcome/authentication
 */
export async function sportMonksFetchJson<T>(
  pathWithLeadingSlash: string,
  token: string,
  search?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const viaServerRelay = token === TF_SM_SERVER_RELAY_PLACEHOLDER
  const url = buildSmRequestUrl(pathWithLeadingSlash, search, viaServerRelay)
  const urlKey = url.toString()

  let p = smInflightJson.get(urlKey) as Promise<T> | undefined
  if (!p) {
    p = (async (): Promise<T> => {
      const first = await fetchJsonBody(urlKey, viaServerRelay ? {} : { Authorization: token })
      if (!first.ok) {
        const msg =
          typeof first.body === 'object' && first.body && 'message' in first.body
            ? String((first.body as { message: string }).message)
            : first.text.slice(0, 200)
        /**
         * Cas fréquent : relais serveur configuré avec une clé sans accès `odds`,
         * alors que le token navigateur (Profil → Données) a ce droit.
         * On retente en direct une fois pour éviter les "cotes indisponibles" permanentes.
         */
        if (
          viaServerRelay &&
          first.status === 403 &&
          /odds/i.test(msg) &&
          /include/i.test(msg)
        ) {
          const browserToken = readBrowserSportMonksToken()
          if (browserToken) {
            const directUrl = buildSmRequestUrl(pathWithLeadingSlash, search, false)
            const directFirst = await fetchJsonBody(directUrl.toString(), { Authorization: browserToken })
            if (!directFirst.ok) {
              // Certains comptes exigent api_token en query (même si Authorization fonctionne ailleurs).
              const directAltUrl = new URL(directUrl.toString())
              directAltUrl.searchParams.set('api_token', browserToken)
              const directAlt = await fetchJsonBody(directAltUrl.toString(), {})
              if (directAlt.ok) return directAlt.body as T
              const directMsg =
                typeof directFirst.body === 'object' && directFirst.body && 'message' in directFirst.body
                  ? String((directFirst.body as { message: string }).message)
                  : directFirst.text.slice(0, 200)
              throw new Error(`SportMonks ${directFirst.status}: ${directMsg}`)
            }
            return directFirst.body as T
          }
        }
        if (!viaServerRelay && first.status === 403 && /odds/i.test(msg) && /include/i.test(msg)) {
          const altUrl = new URL(urlKey)
          altUrl.searchParams.set('api_token', token)
          const alt = await fetchJsonBody(altUrl.toString(), {})
          if (alt.ok) return alt.body as T
        }
        throw new Error(`SportMonks ${first.status}: ${msg}`)
      }
      return first.body as T
    })()
    smInflightJson.set(urlKey, p as Promise<unknown>)
    void (p as Promise<unknown>).finally(() => {
      if (smInflightJson.get(urlKey) === p) smInflightJson.delete(urlKey)
    })
  }
  return (await p) as T
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
