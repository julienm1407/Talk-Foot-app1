export type NewsItem = {
  id: string
  title: string
  excerpt: string
  tag: 'Breaking' | 'Analyse' | 'Rumeurs' | 'Débrief'
  minutesAgo: number
  /** Ligues concernées (ids type competitionThemes). Vide = général */
  leagueIds?: string[]
  /** Clubs mentionnés (optionnel, pour filtre fin) */
  clubIds?: string[]
  /** URL publique /article/:slug — absent pour les actus générées (ex. synthétiques) */
  slug?: string
  /** Date de publication (ISO) — SEO & balise <time> */
  publishedAt?: string
  /** Paragraphes du corps — page article si présent avec slug */
  body?: string[]
  /** Source markdown auteur (V1 éditeur). */
  bodyMarkdown?: string
  /** Visuel de couverture (optionnel). */
  coverImageUrl?: string
  /** Signature auteur (optionnel). */
  authorName?: string
  /** Date de dernière mise à jour ISO. */
  updatedAt?: string
}

// Images football Unsplash — licence Unsplash (usage libre) https://unsplash.com/license
const FOOTBALL_IMAGES = [
  '1574629810360-7efbbe195018', // Stade, vue terrain
  '1579952363873-27f3bade9f55', // Ballon sur la pelouse
  '1522778119026-d647482059dc', // Match, ambiance
  '1715270525118-ce589797568b', // Joueur en action
  '1508098682722-e3c9e7a2e26a', // Stade aérien
]

/** Image « une » page article (même lot Unsplash License — vue stade / terrain). */
const ARTICLE_LEAD_FREE_PHOTO = '1574629810360-7efbbe195018'

function imageIndex(articleId: string): number {
  return articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % FOOTBALL_IMAGES.length
}

export type NewsImageVariant = 'feed' | 'hero' | 'og' | 'articleLead'

const IMAGE_PARAMS: Record<NewsImageVariant, string> = {
  feed: 'w=720&h=400&fit=crop&q=80',
  hero: 'w=1600&h=720&fit=crop&q=85',
  og: 'w=1200&h=630&fit=crop&q=85',
  /** Colonne ~30 % : format un peu portrait, lisible à côté du live */
  articleLead: 'w=560&h=720&fit=crop&crop=entropy&q=85',
}

export function footballImageUrl(articleId: string, variant: NewsImageVariant = 'feed'): string {
  const photoId = variant === 'articleLead' ? ARTICLE_LEAD_FREE_PHOTO : FOOTBALL_IMAGES[imageIndex(articleId)]
  return `https://images.unsplash.com/photo-${photoId}?${IMAGE_PARAMS[variant]}&auto=format`
}

/** Actu éligible à une page /article/:slug */
export function newsItemHasArticlePage(n: NewsItem): n is NewsItem & { slug: string; body: string[] } {
  return Boolean(n.slug && n.body && n.body.length > 0)
}
