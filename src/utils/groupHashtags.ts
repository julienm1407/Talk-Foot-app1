import type { SupporterGroup } from '../types/group'

/** Tags stockés sans #, en minuscules (recherche / filtrage). */

const MAX_TAG_LEN = 32
const MAX_TAGS = 12

export function normalizeHashtag(raw: string): string | null {
  const s = raw.trim().replace(/^#+/u, '').toLowerCase()
  if (!s || s.length > MAX_TAG_LEN) return null
  if (!/^[\p{L}\p{N}_-]+$/u.test(s)) return null
  return s
}

export function normalizeHashtagList(raw: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const r of raw) {
    const n = normalizeHashtag(r)
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(n)
    if (out.length >= MAX_TAGS) break
  }
  return out
}

export function parseHashtagInput(line: string): string[] {
  return normalizeHashtagList(
    line.split(/[\s,#]+/u).filter(Boolean),
  )
}

export const GROUP_HASHTAG_LIMITS = { maxTags: MAX_TAGS, maxTagLen: MAX_TAG_LEN }

/** Filtre découverte : chaque mot-clé doit matcher un hashtag ou le nom / slogan. */
export function groupMatchesInterestTokens(
  g: Pick<SupporterGroup, 'hashtags' | 'name' | 'motto'>,
  tokens: string[],
): boolean {
  if (tokens.length === 0) return true
  const tags = (g.hashtags ?? []).map((x) => x.toLowerCase())
  const hay = `${g.name} ${g.motto}`.toLowerCase()
  return tokens.every((tok) => {
    if (tags.some((h) => h === tok || h.includes(tok))) return true
    return hay.includes(tok)
  })
}
