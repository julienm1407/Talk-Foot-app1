export type NewsItem = {
  id: string
  title: string
  excerpt: string
  tag: 'Breaking' | 'Analyse' | 'Rumeurs' | 'Débrief'
  minutesAgo: number
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
    title: 'Changement tactique: le coach surprend au coup d’envoi',
    excerpt:
      'Un système inattendu pour bloquer les transitions. Les supporters réagissent déjà en masse sur les serveurs.',
  },
  {
    id: 'n-2',
    tag: 'Analyse',
    minutesAgo: 22,
    title: 'Pourquoi le pressing haut fait la différence ce soir',
    excerpt:
      'Deux séquences clés montrent comment l’équipe récupère dans les 5 secondes. À suivre: le couloir gauche.',
  },
  {
    id: 'n-3',
    tag: 'Rumeurs',
    minutesAgo: 48,
    title: 'Mercato: un profil “box-to-box” dans le viseur',
    excerpt:
      'Selon plusieurs sources, le club explore une piste prioritaire. Rien d’officiel, mais les signaux s’accumulent.',
  },
  {
    id: 'n-4',
    tag: 'Débrief',
    minutesAgo: 75,
    title: 'Le match d’avant: 3 moments qui ont fait basculer l’ambiance',
    excerpt:
      'Un arrêt décisif, une relance risquée et un but refusé: retour sur les actions qui ont enflammé le live.',
  },
]

