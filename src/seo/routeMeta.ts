import { SITE_DEFAULT_DESCRIPTION, SITE_NAME } from './siteCopy'

export type RouteSeoConfig = {
  title: string
  description: string
  /** noindex pour login / admin */
  robots?: 'index, follow' | 'noindex, nofollow'
}

const FALLBACK_GENERIC: RouteSeoConfig = {
  title: SITE_NAME,
  description: SITE_DEFAULT_DESCRIPTION,
}

const HOME: RouteSeoConfig = {
  title: `${SITE_NAME} — live foot, débats et tribunes`,
  description: SITE_DEFAULT_DESCRIPTION,
}

const PRIVACY: RouteSeoConfig = {
  title: `Confidentialité & données — ${SITE_NAME}`,
  description:
    'Politique de confidentialité Talk Foot : données collectées, finalités, cookies et tes droits (RGPD).',
}

const TERMS: RouteSeoConfig = {
  title: `Conditions d'utilisation — ${SITE_NAME}`,
  description:
    "Conditions d'utilisation Talk Foot : règles de conduite, responsabilités, disponibilité du service et modération.",
}

const ABOUT: RouteSeoConfig = {
  title: `À propos — ${SITE_NAME}`,
  description:
    'Présentation de Talk Foot : réseau social football, contenus éditoriaux, modération communautaire et contact éditeur.',
}

const LOGIN: RouteSeoConfig = {
  title: `Connexion — ${SITE_NAME}`,
  description: `Connecte-toi à ${SITE_NAME} pour accéder au live, aux tribunes supporters et à ton profil.`,
  robots: 'noindex, nofollow',
}

const MATCH: RouteSeoConfig = {
  title: `Matchs & agenda — ${SITE_NAME}`,
  description:
    'Calendrier des matchs, directs commentés, tribunes par rencontre et ambiance live sur Talk Foot.',
}

const PRONOSTIC: RouteSeoConfig = {
  title: `Mes paris & pronostics — ${SITE_NAME}`,
  description:
    'Retrouve tes paris, ton solde de jetons, le classement des parieurs et accède à la tribune live pour parier.',
  robots: 'noindex, nofollow',
}

const GROUPS: RouteSeoConfig = {
  title: `Groupes & tribunes supporters — ${SITE_NAME}`,
  description:
    'Rejoins des tribunes virtuelles par club ou thème : discussions, débats et vie de groupe entre fans.',
}

const DEBATES: RouteSeoConfig = {
  title: `Débats & tribunes — ${SITE_NAME}`,
  description: 'Les sujets qui fâchent et passionnent : avis tranchés, sondages et discussions entre supporters.',
}

const RANKINGS: RouteSeoConfig = {
  title: `Classements championnats — ${SITE_NAME}`,
  description: 'Classements du Big 5, analyses de forme et tableaux SportMonks des championnats suivis.',
}

const BOUTIQUE: RouteSeoConfig = {
  title: `Boutique — ${SITE_NAME}`,
  description: 'Goodies, maillots inspirés et personnalisation avatar — boutique Talk Foot (simulation).',
}

const VIDEOS: RouteSeoConfig = {
  title: `Vidéos & extraits — ${SITE_NAME}`,
  description: 'Extraits, moments forts et contenus vidéo autour du foot sur Talk Foot.',
}

const PROFILE: RouteSeoConfig = {
  title: `Profil & progression — ${SITE_NAME}`,
  description: 'Personnalise ton profil supporter, tes favoris et ton avatar sur Talk Foot.',
  robots: 'noindex, nofollow',
}

const DATA_SOURCES: RouteSeoConfig = {
  title: `SportMonks — clé API — ${SITE_NAME}`,
  description: 'Configurer SportMonks pour les matchs en direct et le calendrier.',
  robots: 'noindex, nofollow',
}

const USER_VITRINE: RouteSeoConfig = {
  title: `Profil supporter — ${SITE_NAME}`,
  description: 'Profil public supporter sur Talk Foot : pseudo, club de cœur et contact.',
  robots: 'noindex, nofollow',
}

const ADMIN: RouteSeoConfig = {
  title: `Administration — ${SITE_NAME}`,
  description: 'Espace administration Talk Foot.',
  robots: 'noindex, nofollow',
}

const CHANNEL: RouteSeoConfig = {
  title: `Tribune live — ${SITE_NAME}`,
  description:
    'Tribune de match en direct : chat, réactions et ambiance stade. Connecte-toi pour participer au live Talk Foot.',
  robots: 'noindex, nofollow',
}

const GROUP: RouteSeoConfig = {
  title: `Groupe supporter — ${SITE_NAME}`,
  description: 'Tribune de groupe Talk Foot : messages, débats et ambiance entre fans.',
  robots: 'noindex, nofollow',
}

const DEBATE_DETAIL: RouteSeoConfig = {
  title: `Débat — ${SITE_NAME}`,
  description: 'Fil de débat Talk Foot entre supporters.',
  robots: 'noindex, nofollow',
}

const STADIUM: RouteSeoConfig = {
  title: `Stade digital — ${SITE_NAME}`,
  description: 'Vue stade et tribunes virtuelles Talk Foot.',
  robots: 'noindex, nofollow',
}

/**
 * Métadonnées SEO pour les routes SPA (hors /article/* géré par useArticleSeo).
 */
export function seoForRoutePath(pathname: string): RouteSeoConfig | null {
  if (pathname.startsWith('/article/')) return null

  if (pathname === '/' || pathname === '') return HOME
  if (pathname === '/privacy') return PRIVACY
  if (pathname === '/terms') return TERMS
  if (pathname === '/about') return ABOUT
  if (pathname === '/login') return LOGIN
  if (pathname === '/match' || pathname === '/matches' || pathname === '/agenda' || pathname === '/calendar')
    return MATCH
  if (pathname === '/pronostic') return PRONOSTIC
  if (pathname === '/groups') return GROUPS
  if (pathname === '/debates') return DEBATES
  if (pathname.startsWith('/debate/')) return DEBATE_DETAIL
  if (pathname === '/rankings') return RANKINGS
  if (pathname === '/boutique') return BOUTIQUE
  if (pathname === '/videos') return VIDEOS
  if (pathname === '/profile') return PROFILE
  if (pathname === '/settings/donnees') return DATA_SOURCES
  if (pathname.startsWith('/user/')) return USER_VITRINE
  if (pathname === '/admin') return ADMIN
  if (pathname.startsWith('/channel/')) {
    if (pathname.endsWith('/stade')) return STADIUM
    return CHANNEL
  }
  if (pathname.startsWith('/group/')) return GROUP

  return FALLBACK_GENERIC
}
