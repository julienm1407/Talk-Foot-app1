import { competitionThemes } from './competitionThemes'

export type CompetitionSearchEntry = {
  id: string
  name: string
  shortName: string
  href: string
  subtitle: string
  /** Mots-clés et alias (ldc, c1, pl, etc.) — insensible accents/casse côté recherche. */
  keywords: string
}

function entry(
  id: keyof typeof competitionThemes,
  extraKeywords: string,
  href: string,
  subtitle: string,
): CompetitionSearchEntry {
  const theme = competitionThemes[id]
  return {
    id,
    name: theme.name,
    shortName: theme.shortName,
    href,
    subtitle,
    keywords: [theme.name, theme.shortName, theme.id, extraKeywords].join(' '),
  }
}

/** Compétitions indexées dans la barre de recherche site. */
export const COMPETITION_SEARCH_ENTRIES: readonly CompetitionSearchEntry[] = [
  entry('ligue-1', 'ligue un l1 championnat france division 1 d1 hexagone', '/match?comp=ligue-1', 'Matchs & calendrier · classement Big 5'),
  entry('ligue-2', 'ligue deux l2 championnat france 2e division', '/match?comp=ligue-2', 'Matchs & calendrier · Ligue 2'),
  entry('epl', 'premier league pl angleterre england english', '/match?comp=epl', 'Matchs & calendrier · classement Big 5'),
  entry('laliga', 'la liga espagne spain spanish primera', '/match?comp=laliga', 'Matchs & calendrier · classement Big 5'),
  entry('serie-a', 'serie a sa italie italy calcio', '/match?comp=serie-a', 'Matchs & calendrier · classement Big 5'),
  entry('bund', 'bundesliga bun allemagne germany deutschland', '/match?comp=bund', 'Matchs & calendrier · classement Big 5'),
  entry(
    'ucl',
    'ligue des champions ldc ucl c1 champions league europe',
    '/match?comp=ucl',
    'LDC · matchs & calendrier',
  ),
  entry('uel', 'ligue europa uel el europa league europe', '/match?comp=uel', 'Ligue Europa · matchs & calendrier'),
  entry(
    'uecl',
    'conference league uecl ecl europa conf europe',
    '/match?comp=uecl',
    'Europa Conf. · matchs & calendrier',
  ),
  entry(
    'wc-2026',
    'coupe du monde cdm mondial 2026 world cup fifa',
    '/cdm',
    'Poules, arbre & classements CDM',
  ),
] as const

/** Alias exacts (requête normalisée) → id compétition pour boost de pertinence. */
export const COMPETITION_SEARCH_ALIAS_TO_ID: Readonly<Record<string, string>> = {
  l1: 'ligue-1',
  l2: 'ligue-2',
  pl: 'epl',
  epl: 'epl',
  sa: 'serie-a',
  bun: 'bund',
  ucl: 'ucl',
  ldc: 'ucl',
  c1: 'ucl',
  uel: 'uel',
  el: 'uel',
  uecl: 'uecl',
  ecl: 'uecl',
  cdm: 'wc-2026',
  wc: 'wc-2026',
}

export function competitionHref(compId: string): string {
  if (compId === 'wc-2026') return '/cdm'
  return `/match?comp=${encodeURIComponent(compId)}`
}

export function rankingsHrefForLeague(leagueId: string): string {
  return `/rankings?league=${encodeURIComponent(leagueId)}`
}
