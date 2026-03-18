export type NewsItem = {
  id: string
  title: string
  excerpt: string
  tag: 'Breaking' | 'Analyse' | 'Rumeurs' | 'Débrief'
  minutesAgo: number
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

