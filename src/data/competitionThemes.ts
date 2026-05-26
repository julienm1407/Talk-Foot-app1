export type CompetitionTheme = {
  id: string
  name: string
  /** Sigle affiché sans logo (onboarding, badges). */
  shortName: string
  accent: string
  accent2: string
  labelBg: string
  labelText: string
}

export const competitionThemes: Record<string, CompetitionTheme> = {
  'ligue-1': {
    id: 'ligue-1',
    name: 'Ligue 1',
    shortName: 'L1',
    accent: '#0b1b3a',
    accent2: '#0ea5e9',
    labelBg: 'bg-sky-100',
    labelText: 'text-sky-900',
  },
  epl: {
    id: 'epl',
    name: 'Premier League',
    shortName: 'EPL',
    accent: '#4c1d95',
    accent2: '#22c55e',
    labelBg: 'bg-violet-100',
    labelText: 'text-violet-900',
  },
  laliga: {
    id: 'laliga',
    name: 'LaLiga',
    shortName: 'LaLiga',
    accent: '#0f172a',
    accent2: '#f59e0b',
    labelBg: 'bg-amber-100',
    labelText: 'text-amber-900',
  },
  'serie-a': {
    id: 'serie-a',
    name: 'Serie A',
    shortName: 'Serie A',
    accent: '#0b1b3a',
    accent2: '#2563eb',
    labelBg: 'bg-blue-100',
    labelText: 'text-blue-900',
  },
  bund: {
    id: 'bund',
    name: 'Bundesliga',
    shortName: 'BUN',
    accent: '#111827',
    accent2: '#ef4444',
    labelBg: 'bg-rose-100',
    labelText: 'text-rose-900',
  },
  ucl: {
    id: 'ucl',
    name: 'Ligue des champions',
    shortName: 'UCL',
    accent: '#0c1929',
    accent2: '#eab308',
    labelBg: 'bg-amber-100',
    labelText: 'text-amber-950',
  },
  uel: {
    id: 'uel',
    name: 'Ligue Europa',
    shortName: 'UEL',
    accent: '#1e1b4b',
    accent2: '#f97316',
    labelBg: 'bg-orange-100',
    labelText: 'text-orange-950',
  },
  uecl: {
    id: 'uecl',
    name: 'Europa Conf.',
    shortName: 'UECL',
    accent: '#0f172a',
    accent2: '#38bdf8',
    labelBg: 'bg-sky-100',
    labelText: 'text-sky-950',
  },
  'wc-2026': {
    id: 'wc-2026',
    name: 'Coupe du Monde 2026',
    shortName: 'CDM 26',
    accent: '#06214a',
    accent2: '#f4c542',
    labelBg: 'bg-amber-100',
    labelText: 'text-blue-950',
  },
}

export function themeForCompetition(id: string | undefined) {
  if (!id) return null
  return competitionThemes[id] ?? null
}

