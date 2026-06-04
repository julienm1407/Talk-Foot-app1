type ArticleExcerptSource = {
  excerpt?: string | null
  bodyMarkdown?: string | null
  body?: string[]
}

function stripMarkdownToPlain(block: string): string {
  return block
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[\[[^\]]+\]\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function clampExcerpt(text: string, max = 240): string {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

function normalizeExcerptKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/\s+/g, ' ')
}

/** Chapo placeholder admin — ne pas afficher dans le feed ni sous le titre. */
const PLACEHOLDER_EXCERPTS = new Set([
  "résumé court de l'article.",
  "résumé court de l'article",
  'resume court de larticle.',
  'resume court de larticle',
])

function isPlaceholderExcerpt(text: string): boolean {
  const key = normalizeExcerptKey(text).replace(/\.+$/, '')
  return PLACEHOLDER_EXCERPTS.has(key)
}

/** Résumé court affiché sous le titre (champ admin ou 1er paragraphe du corps). */
export function resolveArticleExcerpt(article: ArticleExcerptSource): string {
  const direct = article.excerpt?.trim()
  if (direct && !isPlaceholderExcerpt(direct)) return direct

  const md = article.bodyMarkdown?.trim()
  if (md) {
    for (const block of md.split(/\n{2,}/)) {
      const plain = stripMarkdownToPlain(block)
      if (plain.length >= 24) return clampExcerpt(plain)
    }
  }

  const legacy = article.body?.map((p) => p.trim()).find((p) => p.length >= 24)
  if (legacy) return clampExcerpt(stripMarkdownToPlain(legacy))

  return ''
}

/** Extrait valide pour enregistrement (ignore le chapo placeholder admin). */
export function resolveStoredArticleExcerpt(
  excerpt: string,
  fallbackSource: Omit<ArticleExcerptSource, 'excerpt'>,
): string {
  const trimmed = excerpt.trim()
  if (trimmed && !isPlaceholderExcerpt(trimmed)) return trimmed
  return resolveArticleExcerpt({ excerpt: '', ...fallbackSource })
}
