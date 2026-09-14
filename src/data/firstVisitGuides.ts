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
    title: 'Ton hub supporter',
    body: 'Ici tu suis le live, les actus et tes clubs. C’est le point de départ de Talk Foot.',
    bullets: [
      'Ouvre un match pour la tribune live',
      'Boutique & formules sont à un tap',
      'Mon espace garde tes clubs et tes offres',
    ],
  },
  match: {
    id: 'match',
    eyebrow: 'Matchs',
    title: 'Le calendrier live',
    body: 'Tous les matchs du jour et à venir. Tape une affiche pour entrer dans la tribune.',
    bullets: ['Score et minute en direct', 'Pronos avant le coup d’envoi', 'Chat d’ambiance pendant le match'],
  },
  groups: {
    id: 'groups',
    eyebrow: 'Tribunes',
    title: 'Tes groupes de supporters',
    body: 'Rejoins une tribune de club ou crée la tienne pour débattre entre fans.',
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
    bullets: ['Ultra : 4,99 € / mois', 'Ambassadeur : 14,99 € / mois', 'Tu peux rester gratuit'],
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
    body: 'Photo, avatar 3D, clubs favoris et formules : tout se règle ici.',
    bullets: ['Studio maillot / accessoires', 'Formules supporters', 'Achat de médailles'],
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
  if (p === '/profile' || p.startsWith('/profile/')) return 'profile'
  return null
}
