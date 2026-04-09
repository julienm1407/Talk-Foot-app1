export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/**
 * Partage natif (Web Share API) ou copie du lien dans le presse-papiers.
 */
export async function shareOrCopyLink(opts: {
  title: string
  text: string
  url: string
}): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      })
      return 'shared'
    } catch (e) {
      const err = e as { name?: string }
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(opts.url)
      return 'copied'
    }
  } catch {
    /* fall through */
  }
  return 'failed'
}

export function absoluteAppUrl(path: string) {
  if (typeof window === 'undefined') return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${p}`
}

/** Message MP interne : repère visuel + titre, sans URL. */
export function formatInternalShareBody(title: string) {
  return `↗ « ${title.trim()} »`
}
