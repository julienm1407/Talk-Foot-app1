import type { User } from '../types/chat'

/** Ligne de chat affichée en aperçu (le club reste en données mock, non affiché — débat indépendant). */
export type DebatePreviewMessage = {
  username: string
  fanClubId: string
  text: string
}

export type DebateParticipantAvatar = {
  avatarSeed: string
  accent: User['accent']
}

export type Debate = {
  id: string
  title: string
  excerpt: string
  groupId: string
  accent: string
  messagesCount: number
  participantsCount: number
  trending?: boolean
  /** Image hero (débat du jour). */
  heroImageUrl?: string
  /** 2–3 visuels “en ligne” sur la carte principale. */
  activeParticipants?: DebateParticipantAvatar[]
  /** Fil d’aperçu : accueil montre les 2 premiers ; page débat = tout. */
  previewMessages: DebatePreviewMessage[]
}

/** Débat principal — colonne centrale, sous le live. */
export const debateOfTheDay: Debate = {
  id: 'd-jour',
  title: 'Mbappé est-il le meilleur joueur du monde actuellement ?',
  excerpt:
    'Stats, Ballon d’or, influence en LDC — viens défendre ton camp avec des arguments (et du respect).',
  groupId: 'g-ultras-nuit',
  accent: '#b91c1c',
  participantsCount: 2430,
  messagesCount: 12890,
  trending: true,
  heroImageUrl:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80&auto=format&fit=crop',
  activeParticipants: [
    { avatarSeed: 'K', accent: 'rose' },
    { avatarSeed: 'M', accent: 'violet' },
    { avatarSeed: 'L', accent: 'emerald' },
  ],
  previewMessages: [
    {
      username: 'KopParis',
      fanClubId: 'psg',
      text: 'Décisif à chaque élimination directe en C1 — personne ne fait peur comme lui en contre.',
    },
    {
      username: 'Tactico7',
      fanClubId: 'mci',
      text: 'On compare pas seulement les buts : pressing, création, volume de jeu… le débat est ouvert.',
    },
    {
      username: 'VirageSud',
      fanClubId: 'om',
      text: 'Meilleur du monde c’est aussi régularité sur 2 saisons, pas 3 mois en feu.',
    },
  ],
}

export const trendingDebates: Debate[] = [
  {
    id: 'd-t1',
    title: 'PSG favori en LDC cette saison ?',
    excerpt: 'Effectif, coach, tirage… où tu les vois au printemps ?',
    groupId: 'g-ultras-nuit',
    accent: '#e11d48',
    participantsCount: 1820,
    messagesCount: 6420,
    trending: true,
    previewMessages: [
      {
        username: 'RougeEtBleu',
        fanClubId: 'psg',
        text: 'Si l’infirmerie nous lâche, on a le plateau pour aller au bout.',
      },
    ],
  },
  {
    id: 'd-t2',
    title: 'Haaland > Mbappé ?',
    excerpt: 'Buteur pur vs joueur complet — trancher (avec des chiffres).',
    groupId: 'g-kop-bleu',
    accent: '#60a5fa',
    participantsCount: 3102,
    messagesCount: 15400,
    trending: true,
    previewMessages: [
      {
        username: 'NordicStriker',
        fanClubId: 'mci',
        text: 'xG monstrueux + présence dans la surface = machine à titres.',
      },
    ],
  },
  {
    id: 'd-t3',
    title: 'Le Real trop fort cette saison ?',
    excerpt: 'Domination européenne ou surcote médiatique ?',
    groupId: 'g-tribune-rouge',
    accent: '#ef4444',
    participantsCount: 980,
    messagesCount: 4102,
    trending: true,
    previewMessages: [
      {
        username: 'MadridistaXX',
        fanClubId: 'rma',
        text: 'Bench + mentalité C1 — ils savent fermer un match mieux que personne.',
      },
    ],
  },
  {
    id: 'd-t4',
    title: 'Le PSG peut-il gagner la C1 sans milieu défensif de métier ?',
    excerpt: 'Tactiques 4-3-3, double pivot, mercato…',
    groupId: 'g-ultras-nuit',
    accent: '#be123c',
    participantsCount: 756,
    messagesCount: 2840,
    trending: true,
    previewMessages: [
      {
        username: 'ZonalMark',
        fanClubId: 'liv',
        text: 'Avec ce rythme en demi, tu prends l’onde sur les transitions.',
      },
    ],
  },
  {
    id: 'd-t5',
    title: 'OM–PSG : salons séparés le jour J ?',
    excerpt: 'Modération, ambiance, sécurité des débats.',
    groupId: 'g-virage-nord',
    accent: '#0ea5e9',
    participantsCount: 420,
    messagesCount: 1188,
    trending: true,
    previewMessages: [
      {
        username: 'SudForever',
        fanClubId: 'om',
        text: 'Deux threads : un pour le match, un pour le mercato — sinon c’est le chaos.',
      },
    ],
  },
  {
    id: 'd-t6',
    title: 'La Liga surclasse la Premier sur le spectacle ?',
    excerpt: 'Rythme, ambiance, stars — quel championnat tu regardes en premier ?',
    groupId: 'g-tribune-rouge',
    accent: '#7c3aed',
    participantsCount: 1104,
    messagesCount: 4320,
    trending: true,
    previewMessages: [
      {
        username: 'TikiFan',
        fanClubId: 'fcb',
        text: 'Les soirs à 21h en semaine, la Liga reste le rendez-vous le plus régulier.',
      },
    ],
  },
]

/** Liste plate pour la page Débats + résolution par id. */
export function getAllDebates(): Debate[] {
  return [debateOfTheDay, ...trendingDebates]
}

/** Résout un débat catalogue ou débats `extras` (ex. sujets publiés dans ton groupe). */
export function getDebateById(id: string, extras: Debate[] = []): Debate | undefined {
  const fromExtras = extras.find((d) => d.id === id)
  if (fromExtras) return fromExtras
  return getAllDebates().find((d) => d.id === id)
}

/** @deprecated Utiliser `Debate` et `trendingDebates`. */
export type DebateTopic = Debate

/** @deprecated Utiliser `trendingDebates`. */
export const mockDebates = trendingDebates
