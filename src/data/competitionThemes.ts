export type CompetitionTheme = {
  id: string
  name: string
  accent: string
  accent2: string
  labelBg: string
  labelText: string
}

export const competitionThemes: Record<string, CompetitionTheme> = {
  'ligue-1': {
    id: 'ligue-1',
    name: 'Ligue 1',
    accent: '#0b1b3a',
    accent2: '#0ea5e9',
    labelBg: 'bg-sky-100',
    labelText: 'text-sky-900',
  },
  epl: {
    id: 'epl',
    name: 'Premier League',
    accent: '#4c1d95',
    accent2: '#22c55e',
    labelBg: 'bg-violet-100',
    labelText: 'text-violet-900',
  },
  laliga: {
    id: 'laliga',
    name: 'LaLiga',
    accent: '#0f172a',
    accent2: '#f59e0b',
    labelBg: 'bg-amber-100',
    labelText: 'text-amber-900',
  },
  'serie-a': {
    id: 'serie-a',
    name: 'Serie A',
    accent: '#0b1b3a',
    accent2: '#2563eb',
    labelBg: 'bg-blue-100',
    labelText: 'text-blue-900',
  },
  bund: {
    id: 'bund',
    name: 'Bundesliga',
    accent: '#111827',
    accent2: '#ef4444',
    labelBg: 'bg-rose-100',
    labelText: 'text-rose-900',
  },
}

export function themeForCompetition(id: string | undefined) {
  if (!id) return null
  return competitionThemes[id] ?? null
}

