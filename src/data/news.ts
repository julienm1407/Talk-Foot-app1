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
}

// Images football Unsplash - licence libre (Unsplash License)
const FOOTBALL_IMAGES = [
  '1574629810360-7efbbe195018', // Stade, vue terrain
  '1579952363873-27f3bade9f55', // Ballon sur la pelouse
  '1522778119026-d647482059dc', // Match, ambiance
  '1715270525118-ce589797568b', // Joueur en action
  '1508098682722-e3c9e7a2e26a', // Stade aérien
]

export function footballImageUrl(articleId: string): string {
  const idx =
    articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) %
    FOOTBALL_IMAGES.length
  const photoId = FOOTBALL_IMAGES[idx]
  return `https://images.unsplash.com/photo-${photoId}?w=360&h=200&fit=crop&q=80`
}

export const mockNews: NewsItem[] = [
  {
    id: 'n-1',
    tag: 'Breaking',
    minutesAgo: 7,
    title: 'Ligue 1 : tension avant le choc du week-end',
    excerpt:
      'Les groupes de supporters Talk Foot saturent avant le derby. Ambiance électrique côté tribunes virtuelles.',
    leagueIds: ['ligue-1'],
    clubIds: ['psg', 'om'],
  },
  {
    id: 'n-2',
    tag: 'Analyse',
    minutesAgo: 22,
    title: 'Premier League : le pressing haut qui change tout',
    excerpt:
      'Deux séquences clés en EPL montrent comment récupérer haut. Focus tactique pour les kop connectés.',
    leagueIds: ['epl'],
  },
  {
    id: 'n-3',
    tag: 'Rumeurs',
    minutesAgo: 48,
    title: 'Mercato : la Serie A sur un milieu prioritaire',
    excerpt:
      'Plusieurs clubs italiens suivent la même piste. Rien d’officiel, mais les rumeurs circulent sur les salons.',
    leagueIds: ['serie-a'],
  },
  {
    id: 'n-4',
    tag: 'Débrief',
    minutesAgo: 75,
    title: 'LaLiga : trois actions qui ont fait vibrer le live',
    excerpt:
      'Arrêt décisif, contre rapide et VAR : retour sur une soirée intense pour les supporters connectés.',
    leagueIds: ['laliga'],
  },
  {
    id: 'n-5',
    tag: 'Analyse',
    minutesAgo: 90,
    title: 'Bundesliga : intensité et transitions',
    excerpt:
      'Pourquoi le championnat allemand reste une référence pour les stats live et les réactions en tribune.',
    leagueIds: ['bund'],
  },
  {
    id: 'n-global',
    tag: 'Breaking',
    minutesAgo: 5,
    title: 'Talk Foot : nouveautés pour ton expérience supporter',
    excerpt:
      'Personnalise ton club et ta ligue, filtre les salons et active le mode Virage pour un live 100 % tribune.',
    // pas de leagueIds = visible pour tous
  },
]

