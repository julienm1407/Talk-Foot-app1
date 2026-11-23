export type PronoShareState = 'open' | 'won' | 'lost'

export type PronoShareVote = {
  home: number
  draw: number
  away: number
}

export type PronoSharePayload = {
  v: 1
  matchId: string
  home: string
  away: string
  homeShort: string
  awayShort: string
  homeColor: string
  awayColor: string
  homeLogoUrl?: string
  awayLogoUrl?: string
  competition: string
  when: string
  displayName: string
  outcome: string
  team: string
  odds?: string
  form?: string
  state: PronoShareState
  sharerId: string
  vote?: PronoShareVote
  wonScore?: string
  week?: { rank: number; tokens: number; pct: number }
  invite: string
  storyImageUrl?: string
  ogImageUrl?: string
}

export const MIN_FORM_DECIDED = 5
export const MIN_COMMUNITY_VOTES = 20

export function votePercents(vote: PronoShareVote): { home: number; draw: number; away: number; total: number } {
  const total = vote.home + vote.draw + vote.away
  if (total <= 0) return { home: 0, draw: 0, away: 0, total: 0 }
  const home = Math.round((vote.home / total) * 100)
  const away = Math.round((vote.away / total) * 100)
  const draw = Math.max(0, 100 - home - away)
  return { home, draw, away, total }
}

export function encodeInlineShareId(payload: PronoSharePayload): string {
  const slim: PronoSharePayload = { ...payload }
  delete slim.storyImageUrl
  delete slim.ogImageUrl
  delete slim.homeLogoUrl
  delete slim.awayLogoUrl
  const json = JSON.stringify(slim)
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `b.${b64}`
}

export function decodeInlineShareId(id: string): PronoSharePayload | null {
  if (!id.startsWith('b.')) return null
  try {
    const pad = id.slice(2).replace(/-/g, '+').replace(/_/g, '/')
    const padded = pad + '==='.slice((pad.length + 3) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(json) as PronoSharePayload
    if (parsed?.v !== 1 || !parsed.matchId) return null
    return parsed
  } catch {
    return null
  }
}

export function randomShareId(): string {
  const alphabet = '23456789abcdefghijkmnpqrstuvwxyz'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
