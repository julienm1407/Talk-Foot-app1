/**
 * Trie les query params par clé pour une URL stable → meilleur hit-rate cache CDN (`/api/sm`).
 */
export function sortSearchParamsForStableCaching(u: URL): void {
  const entries = [...u.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'))
  const sp = u.searchParams
  const keys = [...new Set(sp.keys())]
  for (const k of keys) sp.delete(k)
  for (const [k, v] of entries) sp.append(k, v)
}
