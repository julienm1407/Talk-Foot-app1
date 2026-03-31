/**
 * Thèmes par section TalkFoot.
 *
 * Base : bleu #023458 (structure) + blanc / surfaces — CTA & live : rouge #ff3b3b uniquement.
 * Accents repérage (~5 %) : 🟠 Matchs #FF9F43 · 🟣 Groupes #6C5CE7 · 🟢 Classements #00B894
 * (traits menu, bandeau header, filets de titre — jamais fond principal ni boutons primaires).
 */

export type AppSectionId =
  | 'home'
  | 'matches'
  | 'calendar'
  | 'groups'
  | 'group'
  | 'rankings'
  | 'debates'
  | 'profile'
  | 'channel'
  | 'stade'
  | 'boutique'
  | 'videos'
  | 'default'

/** Encarts DA : carte blanche, bordure bleu structure, CTA rouge — pas de gros dégradés */
const encartBase =
  'relative flex flex-col overflow-hidden rounded-tf-xl border border-tf-dark/18 bg-tf-white shadow-tf-elev-2 outline-none transition hover:border-tf-dark/28 focus-visible:ring-2 focus-visible:ring-tf-dark/35 focus-visible:ring-offset-2'

const DA_ENCART: SectionEncartTheme = {
  wrap: encartBase,
  bar: 'bg-tf-dark',
  badge: 'bg-tf-dark text-white ring-1 ring-black/10 shadow-sm',
  pathClass: 'text-tf-dark font-bold',
  cta: 'text-tf-dark font-black',
  ctaBar: 'border-t border-tf-dark/12 bg-tf-dark text-white',
  pillButton:
    'rounded-tf-lg border border-tf-cta-hover/35 bg-tf-cta px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-tf-cta transition hover:bg-tf-cta-hover',
}

export type SectionEncartTheme = {
  wrap: string
  bar: string
  badge: string
  pathClass: string
  /** Lien texte secondaire (flèche, légende) */
  cta: string
  /** Bandeau bas contrasté (ex. « Entrer dans le salon ») — prévu pour texte blanc */
  ctaBar: string
  /** Bouton / lien bloc plein dans l’encart */
  pillButton: string
}

export type SectionNavTheme = {
  active: string
  inactiveHover: string
  focus: string
  arrowHover: string
}

export type SectionTheme = {
  id: AppSectionId
  label: string
  hint?: string
  shellStripe: string
  encart: SectionEncartTheme
  page: {
    eyebrowClass: string
    borderBottomClass: string
  }
  nav: SectionNavTheme
}

export const ENCART_LIVE = DA_ENCART
export const ENCART_AGENDA = DA_ENCART
export const ENCART_GROUPS = DA_ENCART
export const ENCART_RANKINGS = DA_ENCART
export const ENCART_DEBATES = DA_ENCART
export const ENCART_STADE = DA_ENCART
export const ENCART_BOUTIQUE = DA_ENCART
export const ENCART_VIDEOS = DA_ENCART

/** Accueil & pages neutres : structure bleue uniquement */
const NAV_HOME: SectionNavTheme = {
  active: 'bg-tf-white text-tf-dark shadow-sm ring-2 ring-tf-dark/22',
  inactiveHover: 'hover:bg-tf-electric-soft hover:text-tf-dark',
  focus: 'focus-visible:ring-tf-dark/45',
  arrowHover: 'group-hover:text-tf-dark',
}

/** 🟠 Matchs (+ page Match, salon live) */
const NAV_MATCH: SectionNavTheme = {
  active: 'bg-tf-white text-tf-dark shadow-sm ring-2 ring-tf-nav-match/42',
  inactiveHover: 'hover:bg-tf-electric-soft hover:text-tf-dark',
  focus: 'focus-visible:ring-tf-nav-match/50',
  arrowHover: 'group-hover:text-tf-nav-match',
}

/** 🟣 Groupes (+ débats, salons) */
const NAV_GROUPS: SectionNavTheme = {
  active: 'bg-tf-white text-tf-dark shadow-sm ring-2 ring-tf-nav-groups/42',
  inactiveHover: 'hover:bg-tf-electric-soft hover:text-tf-dark',
  focus: 'focus-visible:ring-tf-nav-groups/50',
  arrowHover: 'group-hover:text-tf-nav-groups',
}

/** 🟢 Classements (+ profil / paris) */
const NAV_RANKINGS: SectionNavTheme = {
  active: 'bg-tf-white text-tf-dark shadow-sm ring-2 ring-tf-nav-rankings/42',
  inactiveHover: 'hover:bg-tf-electric-soft hover:text-tf-dark',
  focus: 'focus-visible:ring-tf-nav-rankings/50',
  arrowHover: 'group-hover:text-tf-nav-rankings',
}

/** Bandeau sous header : bleu structure + fin trait de section */
const stripeHome = 'h-1 bg-tf-dark'
const stripeMatch =
  'h-1 bg-tf-dark shadow-[inset_0_-2px_0_0_rgba(255,159,67,0.9)]'
const stripeGroups =
  'h-1 bg-tf-dark shadow-[inset_0_-2px_0_0_rgba(108,92,231,0.88)]'
const stripeRankings =
  'h-1 bg-tf-dark shadow-[inset_0_-2px_0_0_rgba(0,184,148,0.9)]'

export const APP_SECTION_THEMES: Record<AppSectionId, SectionTheme> = {
  home: {
    id: 'home',
    label: 'Accueil',
    hint: 'Fil live & actus',
    shellStripe: stripeHome,
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-dark',
      borderBottomClass: 'border-tf-grey-pastel/70',
    },
    nav: NAV_HOME,
  },
  matches: {
    id: 'matches',
    label: 'Match',
    hint: 'Direct & calendrier',
    shellStripe: stripeMatch,
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-match/25',
    },
    nav: NAV_MATCH,
  },
  calendar: {
    id: 'calendar',
    label: 'Match',
    hint: 'Matchs à venir',
    shellStripe: stripeMatch,
    encart: ENCART_AGENDA,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-match/25',
    },
    nav: NAV_MATCH,
  },
  groups: {
    id: 'groups',
    label: 'Groupes',
    hint: 'Tribunes & débats',
    shellStripe: stripeGroups,
    encart: ENCART_GROUPS,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-groups/25',
    },
    nav: NAV_GROUPS,
  },
  group: {
    id: 'group',
    label: 'Groupe',
    hint: 'Salon du groupe',
    shellStripe: stripeGroups,
    encart: ENCART_GROUPS,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-groups/25',
    },
    nav: NAV_GROUPS,
  },
  rankings: {
    id: 'rankings',
    label: 'Classement',
    hint: 'Parieurs & ligues',
    shellStripe: stripeRankings,
    encart: ENCART_RANKINGS,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-rankings/25',
    },
    nav: NAV_RANKINGS,
  },
  debates: {
    id: 'debates',
    label: 'Débats',
    hint: 'Fils & polémiques',
    shellStripe: stripeGroups,
    encart: ENCART_DEBATES,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-groups/25',
    },
    nav: NAV_GROUPS,
  },
  profile: {
    id: 'profile',
    label: 'Profil',
    hint: 'Compte & paris',
    shellStripe: stripeRankings,
    encart: ENCART_RANKINGS,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-rankings/25',
    },
    nav: {
      ...NAV_RANKINGS,
      active: `${NAV_RANKINGS.active} border-tf-nav-rankings/20`,
    },
  },
  channel: {
    id: 'channel',
    label: 'Salon live',
    hint: 'Match en direct',
    shellStripe: stripeMatch,
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-dark font-black',
      borderBottomClass: 'border-tf-nav-match/25',
    },
    nav: NAV_MATCH,
  },
  stade: {
    id: 'stade',
    label: 'Stade',
    hint: 'Tribunes virtuelles',
    shellStripe: stripeMatch,
    encart: ENCART_STADE,
    page: {
      eyebrowClass: 'text-tf-dark',
      borderBottomClass: 'border-tf-grey-pastel/70',
    },
    nav: NAV_MATCH,
  },
  boutique: {
    id: 'boutique',
    label: 'Boutique',
    hint: 'Maillots & items',
    shellStripe: stripeHome,
    encart: ENCART_BOUTIQUE,
    page: {
      eyebrowClass: 'text-tf-dark',
      borderBottomClass: 'border-tf-grey-pastel/70',
    },
    nav: NAV_HOME,
  },
  videos: {
    id: 'videos',
    label: 'Vidéos',
    hint: 'Extraits & replays',
    shellStripe: stripeHome,
    encart: ENCART_VIDEOS,
    page: {
      eyebrowClass: 'text-tf-dark',
      borderBottomClass: 'border-tf-grey-pastel/70',
    },
    nav: NAV_HOME,
  },
  default: {
    id: 'default',
    label: 'Talk Foot',
    shellStripe: stripeHome,
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-dark',
      borderBottomClass: 'border-tf-grey-pastel/60',
    },
    nav: NAV_HOME,
  },
}

export function getAppSectionTheme(section: AppSectionId): SectionTheme {
  return APP_SECTION_THEMES[section] ?? APP_SECTION_THEMES.default
}

/**
 * État actif de la nav à 4 entrées : entrée Match ⊃ page Match + salons live ;
 * Groupes ⊃ tribunes + débats.
 */
export function isRouteActiveForSection(section: AppSectionId, pathname: string): boolean {
  const p = pathname || '/'
  if (section === 'home') return p === '/' || p === ''
  if (section === 'matches') {
    return (
      p.startsWith('/matches') ||
      p.startsWith('/calendar') ||
      p.startsWith('/agenda') ||
      p.startsWith('/match') ||
      p.startsWith('/channel/')
    )
  }
  if (section === 'groups') {
    return (
      p.startsWith('/groups') ||
      p.startsWith('/group/') ||
      p.startsWith('/debates') ||
      p.startsWith('/debate/')
    )
  }
  if (section === 'rankings') return p.startsWith('/rankings')
  return false
}

export function getAppSectionFromPath(pathname: string): AppSectionId {
  const p = pathname || '/'
  if (p === '/' || p === '') return 'home'
  if (p.startsWith('/matches')) return 'matches'
  if (p.startsWith('/calendar')) return 'calendar'
  if (p.startsWith('/agenda')) return 'calendar'
  if (p.startsWith('/match')) return 'calendar'
  if (p.startsWith('/groups')) return 'groups'
  if (p.startsWith('/group/')) return 'group'
  if (p.startsWith('/rankings')) return 'rankings'
  if (p.startsWith('/debates') || p.startsWith('/debate/')) return 'debates'
  if (p.startsWith('/profile')) return 'profile'
  if (p.startsWith('/channel/') && /\/stade\/?$/.test(p)) return 'stade'
  if (p.startsWith('/channel/')) return 'channel'
  if (p.startsWith('/boutique')) return 'boutique'
  if (p.startsWith('/videos')) return 'videos'
  if (p.startsWith('/article/')) return 'default'
  return 'default'
}

/** Arborescence officielle : 4 entrées (le reste via la home ou sous-pages). */
export const TOP_NAV_ROUTES: { to: string; end?: boolean; section: AppSectionId }[] = [
  { to: '/', end: true, section: 'home' },
  { to: '/match', end: true, section: 'matches' },
  { to: '/groups', section: 'groups' },
  { to: '/rankings', section: 'rankings' },
]

export const BOTTOM_NAV_ROUTES: { to: string; end?: boolean; section: AppSectionId; icon: string }[] = [
  { to: '/', end: true, section: 'home', icon: '🏟️' },
  { to: '/match', end: true, section: 'matches', icon: '⚽' },
  { to: '/groups', section: 'groups', icon: '👥' },
  { to: '/rankings', section: 'rankings', icon: '🏆' },
]

export const OVERLAY_NAV_ROUTES: {
  to: string
  end?: boolean
  section: AppSectionId
  icon: string
  hint: string
}[] = [
  { to: '/', end: true, section: 'home', icon: '🏟️', hint: 'Fil & actus' },
  { to: '/match', end: true, section: 'matches', icon: '⚽', hint: 'Matchs & lives' },
  { to: '/groups', section: 'groups', icon: '👥', hint: 'Tribunes & débats' },
  { to: '/rankings', section: 'rankings', icon: '🏆', hint: 'Paris & ligues' },
]

/** Clé encart page article → section thème (même palette que l’app). */
export const ARTICLE_ENCART_TO_SECTION = {
  live: 'matches',
  debates: 'debates',
  groups: 'groups',
  stade: 'stade',
  /** Paris / volume : même encart que classements & profil */
  bets: 'rankings',
} as const

export type ArticleEncartKey = keyof typeof ARTICLE_ENCART_TO_SECTION

const ARTICLE_ENCART_COPY: Partial<Record<ArticleEncartKey, { label?: string; hint?: string }>> = {
  bets: { label: 'Classements', hint: 'Paris & ligues' },
}

export function getEncartThemeForArticle(key: ArticleEncartKey): SectionEncartTheme {
  const id = ARTICLE_ENCART_TO_SECTION[key]
  return APP_SECTION_THEMES[id].encart
}

export function getArticleEncartMeta(key: ArticleEncartKey): {
  encart: SectionEncartTheme
  label: string
  hint: string
} {
  const id = ARTICLE_ENCART_TO_SECTION[key]
  const th = APP_SECTION_THEMES[id]
  const over = ARTICLE_ENCART_COPY[key]
  return {
    encart: th.encart,
    label: over?.label ?? th.label,
    hint: over?.hint ?? th.hint ?? '',
  }
}
