type ArticleExcerptSource = {
  excerpt?: string | null
  bodyMarkdown?: string | null
  body?: string[]
}

/** Retire balises HTML / entités — chapôs admin parfois collés depuis un éditeur riche. */
function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
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

function toPlainExcerpt(raw: string): string {
  const plain = stripMarkdownToPlain(stripHtmlToPlain(raw))
  return plain
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
  if (direct && !isPlaceholderExcerpt(direct)) {
    const plain = toPlainExcerpt(direct)
    if (plain.length >= 12) return clampExcerpt(plain)
  }

  const md = article.bodyMarkdown?.trim()
  if (md) {
    for (const block of md.split(/\n{2,}/)) {
      const plain = toPlainExcerpt(block)
      if (plain.length >= 24) return clampExcerpt(plain)
    }
  }

  const legacy = article.body?.map((p) => p.trim()).find((p) => p.length >= 24)
  if (legacy) return clampExcerpt(toPlainExcerpt(legacy))

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
