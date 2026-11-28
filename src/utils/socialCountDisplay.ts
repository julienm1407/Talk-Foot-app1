/** Ne pas afficher les compteurs fantômes (0 participants, tribune calme, etc.). */
export const SOCIAL_COUNT_MIN = 5

export function formatSocialCount(n: number | null | undefined, min = SOCIAL_COUNT_MIN): string | null {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min) return null
  return Math.floor(n).toLocaleString('fr-FR')
}

export function hasSocialPresence(n: number | null | undefined, min = SOCIAL_COUNT_MIN): boolean {
  return typeof n === 'number' && Number.isFinite(n) && n >= min
}

export function formatMembersLabel(n: number | null | undefined): string | null {
  const c = formatSocialCount(n)
  return c ? `${c} membres` : null
}

export function formatDebateSocialLine(
  participants: number | null | undefined,
  messages: number | null | undefined,
): string | null {
  const p = formatSocialCount(participants)
  const m = formatSocialCount(messages)
  if (!p && !m) return null
  const parts: string[] = []
  if (p) parts.push(`👥 ${p} participants`)
  if (m) parts.push(`💬 ${m} messages`)
  return parts.join(' · ')
}

export function newsFeedTag(
  tag: string,
  opts: { publishedAt?: string; minutesAgo?: number },
  nowMs = Date.now(),
): string {
  if (tag !== 'Breaking') return tag
  let ageMs: number | null = null
  if (opts.publishedAt) {
    const t = Date.parse(opts.publishedAt)
    if (Number.isFinite(t)) ageMs = nowMs - t
  }
  if (ageMs == null && typeof opts.minutesAgo === 'number') {
    ageMs = opts.minutesAgo * 60_000
  }
  if (ageMs != null && ageMs > 24 * 60 * 60 * 1000) return 'Analyse'
  return 'Breaking'
}
