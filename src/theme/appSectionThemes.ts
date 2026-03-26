/**
 * DA colorée par sujet : une seule référence d’encart par thème (live, débats, groupes…)
 * réutilisée sur toutes les pages — même sujet = mêmes couleurs & même lisibilité.
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

const encartBase =
  'relative flex flex-col overflow-hidden rounded-2xl border-2 shadow-md outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2'

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

/** ⚽ Live / matchs / salon — référence unique (accueil, matchs, canal, défaut). */
export const ENCART_LIVE: SectionEncartTheme = {
  wrap: `${encartBase} border-sky-500/80 bg-gradient-to-br from-sky-200/90 via-white to-cyan-100 shadow-[0_14px_40px_rgba(14,165,233,0.22)] hover:border-sky-400 focus-visible:ring-sky-500/55`,
  bar: 'bg-gradient-to-b from-sky-500 to-blue-700',
  badge: 'bg-sky-600 text-white ring-2 ring-sky-900/25 shadow-sm',
  pathClass: 'text-sky-950 font-bold',
  cta: 'text-sky-950 font-black',
  ctaBar:
    'border-t-2 border-sky-400/50 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
  pillButton:
    'rounded-xl border-2 border-sky-800/35 bg-sky-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-sky-500 hover:ring-2 hover:ring-sky-300/50',
}

const NAV_MATCH_SKY: SectionNavTheme = {
  active:
    'bg-gradient-to-b from-white to-tf-electric-soft/70 text-tf-dark shadow-md ring-2 ring-tf-electric/45',
  inactiveHover: 'hover:bg-tf-electric-soft/50 hover:text-tf-dark',
  focus: 'focus-visible:ring-tf-electric/40',
  arrowHover: 'group-hover:text-tf-electric-deep',
}

/** 🗓️ Agenda */
export const ENCART_AGENDA: SectionEncartTheme = {
  wrap: `${encartBase} border-indigo-500/75 bg-gradient-to-br from-indigo-200/80 via-white to-violet-100 shadow-[0_12px_36px_rgba(99,102,241,0.18)] hover:border-indigo-400 focus-visible:ring-indigo-500/50`,
  bar: 'bg-gradient-to-b from-indigo-500 to-violet-600',
  badge: 'bg-indigo-600 text-white ring-2 ring-indigo-900/25 shadow-sm',
  pathClass: 'text-indigo-950 font-bold',
  cta: 'text-indigo-950 font-black',
  ctaBar:
    'border-t-2 border-indigo-400/45 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
  pillButton:
    'rounded-xl border-2 border-indigo-800/35 bg-indigo-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-indigo-500',
}

/** 👥 Groupes */
export const ENCART_GROUPS: SectionEncartTheme = {
  wrap: `${encartBase} border-violet-500/75 bg-gradient-to-br from-violet-200/85 via-white to-indigo-100 shadow-[0_12px_36px_rgba(139,92,246,0.2)] hover:border-violet-400 focus-visible:ring-violet-500/50`,
  bar: 'bg-gradient-to-b from-violet-500 to-indigo-700',
  badge: 'bg-violet-600 text-white ring-2 ring-violet-900/25 shadow-sm',
  pathClass: 'text-violet-950 font-bold',
  cta: 'text-violet-950 font-black',
  ctaBar:
    'border-t-2 border-violet-400/45 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
  pillButton:
    'rounded-xl border-2 border-violet-800/35 bg-violet-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-violet-500',
}

const NAV_GROUPS: SectionNavTheme = {
  active:
    'bg-gradient-to-b from-white to-tf-vibe-soft text-tf-dark shadow-md ring-2 ring-violet-400/45',
  inactiveHover: 'hover:bg-violet-50/90 hover:text-tf-dark',
  focus: 'focus-visible:ring-violet-500/45',
  arrowHover: 'group-hover:text-indigo-600',
}

/** 🏆 Classements / paris — même encart pour profil (compte & paris) et article « paris ». */
export const ENCART_RANKINGS: SectionEncartTheme = {
  wrap: `${encartBase} border-amber-500/80 bg-gradient-to-br from-amber-200/90 via-white to-yellow-100 shadow-[0_12px_36px_rgba(245,158,11,0.22)] hover:border-amber-400 focus-visible:ring-amber-500/50`,
  bar: 'bg-gradient-to-b from-amber-500 to-amber-800',
  badge: 'bg-amber-600 text-white ring-2 ring-amber-900/30 shadow-sm',
  pathClass: 'text-amber-950 font-bold',
  cta: 'text-amber-950 font-black',
  ctaBar:
    'border-t-2 border-amber-400/50 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
  pillButton:
    'rounded-xl border-2 border-amber-900/35 bg-amber-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-amber-500',
}

/** 🔥 Débats */
export const ENCART_DEBATES: SectionEncartTheme = {
  wrap: `${encartBase} border-orange-500/75 bg-gradient-to-br from-orange-200/85 via-white to-amber-100 shadow-[0_12px_36px_rgba(234,88,12,0.2)] hover:border-orange-400 focus-visible:ring-orange-500/50`,
  bar: 'bg-gradient-to-b from-tf-ember to-orange-700',
  badge: 'bg-orange-600 text-white ring-2 ring-orange-900/25 shadow-sm',
  pathClass: 'text-orange-950 font-bold',
  cta: 'text-orange-950 font-black',
  ctaBar:
    'border-t-2 border-orange-400/45 bg-gradient-to-r from-orange-600 via-tf-ember to-red-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
  pillButton:
    'rounded-xl border-2 border-orange-800/35 bg-orange-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-orange-500',
}

/** 🏟️ Stade */
export const ENCART_STADE: SectionEncartTheme = {
  wrap: `${encartBase} border-teal-500/75 bg-gradient-to-br from-emerald-200/80 via-white to-tf-pitch-soft shadow-[0_12px_36px_rgba(13,148,136,0.2)] hover:border-teal-400 focus-visible:ring-tf-pitch/55`,
  bar: 'bg-gradient-to-b from-tf-pitch to-tf-grass-dark',
  badge: 'bg-teal-600 text-white ring-2 ring-teal-900/25 shadow-sm',
  pathClass: 'text-teal-950 font-bold',
  cta: 'text-teal-950 font-black',
  ctaBar:
    'border-t-2 border-teal-400/45 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
  pillButton:
    'rounded-xl border-2 border-teal-800/35 bg-teal-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-teal-500',
}

/** 🛍️ Boutique */
export const ENCART_BOUTIQUE: SectionEncartTheme = {
  wrap: `${encartBase} border-rose-500/75 bg-gradient-to-br from-rose-200/85 via-white to-fuchsia-100 shadow-[0_12px_36px_rgba(244,63,94,0.18)] hover:border-rose-400 focus-visible:ring-rose-400/50`,
  bar: 'bg-gradient-to-b from-rose-500 to-pink-600',
  badge: 'bg-rose-600 text-white ring-2 ring-rose-900/25 shadow-sm',
  pathClass: 'text-rose-950 font-bold',
  cta: 'text-rose-950 font-black',
  ctaBar:
    'border-t-2 border-rose-400/45 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
  pillButton:
    'rounded-xl border-2 border-rose-800/35 bg-rose-600 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-rose-500',
}

/** 🎬 Vidéos */
export const ENCART_VIDEOS: SectionEncartTheme = {
  wrap: `${encartBase} border-slate-500/70 bg-gradient-to-br from-slate-200/90 via-white to-slate-100 shadow-[0_12px_32px_rgba(51,65,85,0.16)] hover:border-slate-400 focus-visible:ring-slate-500/45`,
  bar: 'bg-gradient-to-b from-slate-600 to-slate-800',
  badge: 'bg-slate-700 text-white ring-2 ring-slate-900/30 shadow-sm',
  pathClass: 'text-slate-900 font-bold',
  cta: 'text-slate-950 font-black',
  ctaBar:
    'border-t-2 border-slate-400/40 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  pillButton:
    'rounded-xl border-2 border-slate-800/40 bg-slate-700 px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition hover:bg-slate-600',
}

export const APP_SECTION_THEMES: Record<AppSectionId, SectionTheme> = {
  home: {
    id: 'home',
    label: 'Accueil',
    hint: 'Fil live & actus',
    shellStripe: 'bg-gradient-to-r from-sky-400 via-tf-electric to-cyan-400',
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-sky-700',
      borderBottomClass: 'border-sky-200/70',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-sky-100/80 text-tf-dark shadow-md ring-2 ring-sky-400/40',
      inactiveHover: 'hover:bg-sky-50/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-sky-500/40',
      arrowHover: 'group-hover:text-sky-600',
    },
  },
  matches: {
    id: 'matches',
    label: 'Matchs',
    hint: 'Live & salons',
    shellStripe: 'bg-gradient-to-r from-sky-500 via-tf-electric to-cyan-500',
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-electric-deep',
      borderBottomClass: 'border-sky-200/80',
    },
    nav: NAV_MATCH_SKY,
  },
  calendar: {
    id: 'calendar',
    label: 'Agenda',
    hint: 'Matchs à venir',
    shellStripe: 'bg-gradient-to-r from-indigo-400 via-tf-vibe to-violet-500',
    encart: ENCART_AGENDA,
    page: {
      eyebrowClass: 'text-indigo-700',
      borderBottomClass: 'border-indigo-200/70',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-tf-vibe-soft text-tf-dark shadow-md ring-2 ring-tf-vibe/40',
      inactiveHover: 'hover:bg-tf-vibe-soft/80 hover:text-tf-dark',
      focus: 'focus-visible:ring-tf-vibe/45',
      arrowHover: 'group-hover:text-tf-vibe',
    },
  },
  groups: {
    id: 'groups',
    label: 'Groupes',
    hint: 'Salons supporters',
    shellStripe: 'bg-gradient-to-r from-violet-500 via-tf-vibe to-indigo-600',
    encart: ENCART_GROUPS,
    page: {
      eyebrowClass: 'text-indigo-700',
      borderBottomClass: 'border-violet-200/75',
    },
    nav: NAV_GROUPS,
  },
  group: {
    id: 'group',
    label: 'Groupe',
    hint: 'Salon du groupe',
    shellStripe: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600',
    encart: ENCART_GROUPS,
    page: {
      eyebrowClass: 'text-indigo-700',
      borderBottomClass: 'border-violet-200/75',
    },
    nav: NAV_GROUPS,
  },
  rankings: {
    id: 'rankings',
    label: 'Classements',
    hint: 'Parieurs & ligues',
    shellStripe: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600',
    encart: ENCART_RANKINGS,
    page: {
      eyebrowClass: 'text-amber-800',
      borderBottomClass: 'border-amber-200/80',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-amber-100/90 text-tf-dark shadow-md ring-2 ring-amber-400/50',
      inactiveHover: 'hover:bg-amber-50/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-amber-500/45',
      arrowHover: 'group-hover:text-amber-700',
    },
  },
  debates: {
    id: 'debates',
    label: 'Débats',
    hint: 'Fils & polémiques',
    shellStripe: 'bg-gradient-to-r from-orange-400 via-tf-ember to-red-500',
    encart: ENCART_DEBATES,
    page: {
      eyebrowClass: 'text-orange-700',
      borderBottomClass: 'border-orange-200/75',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-tf-ember-soft text-tf-dark shadow-md ring-2 ring-orange-400/45',
      inactiveHover: 'hover:bg-orange-50/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-orange-500/40',
      arrowHover: 'group-hover:text-orange-600',
    },
  },
  profile: {
    id: 'profile',
    label: 'Profil',
    hint: 'Compte & paris',
    shellStripe: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500',
    encart: ENCART_RANKINGS,
    page: {
      eyebrowClass: 'text-amber-800',
      borderBottomClass: 'border-amber-200/75',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-amber-100/80 text-tf-dark shadow-md ring-2 ring-amber-500/45 border-amber-400/50',
      inactiveHover: 'hover:bg-amber-50/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-amber-500/45',
      arrowHover: 'group-hover:text-amber-700',
    },
  },
  channel: {
    id: 'channel',
    label: 'Salon live',
    hint: 'Match en direct',
    shellStripe: 'bg-gradient-to-r from-cyan-500 via-tf-electric to-blue-600',
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-electric-deep',
      borderBottomClass: 'border-sky-300/80',
    },
    nav: NAV_MATCH_SKY,
  },
  stade: {
    id: 'stade',
    label: 'Stade',
    hint: 'Tribunes virtuelles',
    shellStripe: 'bg-gradient-to-r from-teal-500 via-tf-pitch to-tf-grass-dark',
    encart: ENCART_STADE,
    page: {
      eyebrowClass: 'text-teal-800',
      borderBottomClass: 'border-teal-200/75',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-tf-pitch-soft text-tf-dark shadow-md ring-2 ring-tf-pitch/45',
      inactiveHover: 'hover:bg-teal-50/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-tf-pitch/45',
      arrowHover: 'group-hover:text-tf-pitch',
    },
  },
  boutique: {
    id: 'boutique',
    label: 'Boutique',
    hint: 'Maillots & items',
    shellStripe: 'bg-gradient-to-r from-rose-400 via-pink-500 to-fuchsia-600',
    encart: ENCART_BOUTIQUE,
    page: {
      eyebrowClass: 'text-rose-700',
      borderBottomClass: 'border-rose-200/70',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-rose-100/80 text-tf-dark shadow-md ring-2 ring-rose-400/40',
      inactiveHover: 'hover:bg-rose-50/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-rose-400/45',
      arrowHover: 'group-hover:text-rose-600',
    },
  },
  videos: {
    id: 'videos',
    label: 'Vidéos',
    hint: 'Extraits & replays',
    shellStripe: 'bg-gradient-to-r from-slate-500 via-slate-600 to-tf-dark',
    encart: ENCART_VIDEOS,
    page: {
      eyebrowClass: 'text-slate-600',
      borderBottomClass: 'border-slate-200/80',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-slate-100/90 text-tf-dark shadow-md ring-2 ring-slate-400/40',
      inactiveHover: 'hover:bg-slate-100/80 hover:text-tf-dark',
      focus: 'focus-visible:ring-slate-500/40',
      arrowHover: 'group-hover:text-slate-600',
    },
  },
  default: {
    id: 'default',
    label: 'Talk Foot',
    shellStripe: 'bg-gradient-to-r from-tf-grey-pastel via-tf-electric to-tf-grey-pastel',
    encart: ENCART_LIVE,
    page: {
      eyebrowClass: 'text-tf-electric-deep',
      borderBottomClass: 'border-tf-grey-pastel/60',
    },
    nav: {
      active:
        'bg-gradient-to-b from-white to-tf-electric-soft/60 text-tf-dark shadow-md ring-2 ring-tf-electric/35',
      inactiveHover: 'hover:bg-white/90 hover:text-tf-dark',
      focus: 'focus-visible:ring-tf-electric/35',
      arrowHover: 'group-hover:text-tf-electric-deep',
    },
  },
}

export function getAppSectionTheme(section: AppSectionId): SectionTheme {
  return APP_SECTION_THEMES[section] ?? APP_SECTION_THEMES.default
}

export function getAppSectionFromPath(pathname: string): AppSectionId {
  const p = pathname || '/'
  if (p === '/' || p === '') return 'home'
  if (p.startsWith('/matches')) return 'matches'
  if (p.startsWith('/calendar')) return 'calendar'
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

export const TOP_NAV_ROUTES: { to: string; end?: boolean; section: AppSectionId }[] = [
  { to: '/', end: true, section: 'home' },
  { to: '/matches', section: 'matches' },
  { to: '/groups', section: 'groups' },
  { to: '/rankings', section: 'rankings' },
]

export const BOTTOM_NAV_ROUTES: { to: string; end?: boolean; section: AppSectionId; icon: string }[] = [
  { to: '/', end: true, section: 'home', icon: '🏟️' },
  { to: '/matches', section: 'matches', icon: '⚽' },
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
  { to: '/', end: true, section: 'home', icon: '🏟️', hint: 'Matchs & salons' },
  { to: '/calendar', section: 'calendar', icon: '🗓️', hint: 'Matchs à venir' },
  { to: '/profile', section: 'profile', icon: '👤', hint: 'Ton compte' },
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
