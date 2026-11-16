export type FirstVisitGuideId =
  | 'home'
  | 'match'
  | 'groups'
  | 'boutique'
  | 'medailles'
  | 'formules'
  | 'pronostic'
  | 'rankings'
  | 'profile'
  | 'channel'
  | 'group'
  | 'debates'

export type FirstVisitGuide = {
  id: FirstVisitGuideId
  eyebrow: string
  title: string
  body: string
  bullets: string[]
}

export const FIRST_VISIT_GUIDES: Record<FirstVisitGuideId, FirstVisitGuide> = {
  home: {
    id: 'home',
    eyebrow: 'Accueil',
    title: 'Bienvenue sur Talk Foot',
    body: 'Barre du bas : Accueil, Matchs, Groupes, Boutique, puis Plus. Tu peux tout parcourir tout de suite.',
    bullets: [
      '⚽ Matchs : calendrier, scores live, tape une affiche → tribune',
      '👥 Groupes : tes tribunes de club',
      '🛍️ Boutique : maillots, jetons et médailles',
      'Connexion (haut à droite) si tu veux garder ton compte',
    ],
  },
  match: {
    id: 'match',
    eyebrow: 'Matchs',
    title: 'Le calendrier live',
    body: 'Onglet Matchs (ballon, barre du bas). Tape une affiche pour ouvrir la tribune du match.',
    bullets: ['Score et minute en direct', 'Pronos avant le coup d’envoi', 'Chat d’ambiance pendant le match'],
  },
  groups: {
    id: 'groups',
    eyebrow: 'Tribunes',
    title: 'Tes groupes de supporters',
    body: 'Onglet Groupes (barre du bas). Rejoins une tribune ou crée la tienne.',
    bullets: ['Fil d’actu + tifo pixel', 'Débats et messages', 'Limites selon ta formule'],
  },
  boutique: {
    id: 'boutique',
    eyebrow: 'Boutique',
    title: 'Maillots, packs & perso',
    body: 'Équipe ton avatar avec des médailles (ou des jetons). Même catalogue pour toutes les formules.',
    bullets: ['Médailles = achat réel', 'Jetons = jeu / paris', 'Le studio applique le look'],
  },
  medailles: {
    id: 'medailles',
    eyebrow: 'Médailles',
    title: 'Recharge ton solde',
    body: 'Les packs de médailles débloquent les achats boutique. C’est le moyen de soutenir Talk Foot.',
    bullets: ['Paiement Play Store / Stripe', 'Solde visible en haut à droite', '1 médaille = beaucoup de jetons'],
  },
  formules: {
    id: 'formules',
    eyebrow: 'Supporters',
    title: 'Trois formules',
    body: 'Supporter est gratuit. Ultra et Ambassadeur débloquent plus de tribunes, de jetons et d’options live.',
    bullets: ['Ultra : 4,99 € / mois', 'Ambassadeur : 14,99 € / mois', 'Le gratuit a des pubs plein écran sur l’app'],
  },
  pronostic: {
    id: 'pronostic',
    eyebrow: 'Pronostic',
    title: 'Paris entre potes',
    body: 'Mise tes jetons sur les matchs. Les gains montent au classement — pas d’argent réel ici.',
    bullets: ['Cotes et scores', 'Suivi de tes paris', 'Jetons offerts chaque jour'],
  },
  rankings: {
    id: 'rankings',
    eyebrow: 'Classement',
    title: 'Ligues & podium',
    body: 'Compare-toi aux autres parieurs et suis le classement de ta ligue favorite.',
    bullets: ['Podium de la saison', 'Classement clubs', 'Tes stats perso'],
  },
  profile: {
    id: 'profile',
    eyebrow: 'Profil',
    title: 'Ton personnage',
    body: 'Icône en haut à droite. Photo, avatar, formules : tout se règle ici. Les clubs favoris, seulement avec un compte.',
    bullets: ['Studio maillot / accessoires', 'Formules supporters', 'Achat de médailles'],
  },
  debates: {
    id: 'debates',
    eyebrow: 'Débats',
    title: 'Les débats',
    body: 'Depuis Groupes ou Plus, ouvre un débat pour argumenter avec les autres supporters.',
    bullets: ['Un sujet = un fil', 'Réponds et vote', 'Reste fair-play'],
  },
  channel: {
    id: 'channel',
    eyebrow: 'Tribune live',
    title: 'Le match en direct',
    body: 'Chat, réactions, tifo et paris : tout se passe pendant le match, comme dans un stade.',
    bullets: ['Onglets Match / Compo / Paris', 'Réactions en un tap', 'Le tifo se dessine à plusieurs'],
  },
  group: {
    id: 'group',
    eyebrow: 'Tribune',
    title: 'Ta communauté',
    body: 'Fil du groupe, tifo, débats : c’est le salon de tes couleurs.',
    bullets: ['Poste et réagis', 'Colorie le tifo', 'Invite d’autres supporters'],
  },
}

export function firstVisitGuideIdFromPath(pathname: string): FirstVisitGuideId | null {
  const p = pathname || '/'
  if (p === '/' || p === '') return 'home'
  if (p.startsWith('/boutique/medailles')) return 'medailles'
  if (p.startsWith('/boutique')) return 'boutique'
  if (p.startsWith('/formules') || p.startsWith('/abonnement')) return 'formules'
  if (p.startsWith('/match') || p.startsWith('/calendar') || p.startsWith('/agenda')) return 'match'
  if (p.startsWith('/channel/')) return 'channel'
  if (p.startsWith('/group/')) return 'group'
  if (p.startsWith('/groups')) return 'groups'
  if (p.startsWith('/pronostic') || p.startsWith('/mes-paris')) return 'pronostic'
  if (p.startsWith('/rankings')) return 'rankings'
  if (p.startsWith('/debates') || p.startsWith('/debate/')) return 'debates'
  if (p === '/profile' || p.startsWith('/profile/')) return 'profile'
  return null
}
