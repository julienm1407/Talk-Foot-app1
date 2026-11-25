/** Libellé club sur les cartes accueil — évite « FC » pour FC Bayern, « LIL · FC », etc. */

const CLUB_PREFIX =
  /^(1\.\s*)?(fc|afc|cf|ac|as|sc|ssc|ud|cd|rc|us|ogc|vfl|vfb|tsv|sv|bk|if|sk)\s+/i

const NAME_ALIASES: { test: RegExp; label: string }[] = [
  { test: /\bbayern\b/i, label: 'Bayern' },
  { test: /\b(manchester\s+united|man\s+united)\b/i, label: 'Man. United' },
  { test: /\b(manchester\s+city|man\s+city)\b/i, label: 'Man. City' },
  { test: /\bparis\s+saint[- ]germain|\bparis\s+sg\b/i, label: 'PSG' },
  { test: /\breal\s+madrid\b/i, label: 'Real Madrid' },
  { test: /\batl[eé]tico(\s+madrid)?\b/i, label: 'Atlético' },
  { test: /\binter\s+milan\b|\bfc\s+internazionale\b/i, label: 'Inter' },
  { test: /\b(borussia\s+)?dortmund\b/i, label: 'Dortmund' },
  { test: /\blille(\s+osc)?\b/i, label: 'Lille' },
]

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export function localizeClubDisplayName(raw: string): string {
  const name = collapseSpaces(raw)
  if (!name) return ''
  for (const a of NAME_ALIASES) {
    if (a.test.test(name)) return a.label
  }
  const stripped = collapseSpaces(name.replace(CLUB_PREFIX, ''))
  return stripped || name
}

function isWeakShortName(short: string, name: string): boolean {
  const s = collapseSpaces(short)
  if (!s) return true
  if (s.length <= 2) return true
  if (/^(FC|CF|AC|AS|SC|US|RC|SV|BK)$/i.test(s)) return true
  const naive = name.slice(0, 3).toUpperCase()
  if (s.toUpperCase() === naive && name.length > 3) return true
  return false
}

/** Abréviation 3 lettres quand le nom API n’est pas au catalogue (FC Bayern → BAY, pas FC). */
export function shortNameFromApiTeamName(apiName: string): string {
  const name = collapseSpaces(apiName)
  if (!name) return '?'
  const localized = localizeClubDisplayName(name)
  if (localized.length <= 8) return localized
  const stripped = collapseSpaces(localized.replace(CLUB_PREFIX, ''))
  const letters = stripped.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase()
  return name.slice(0, 3).toUpperCase()
}

export function hubTeamLabel(team: { name?: string; shortName?: string }): string {
  const name = localizeClubDisplayName(team.name ?? '')
  const short = collapseSpaces(team.shortName ?? '')
  if (name && name.length <= 18) return name
  if (short && !isWeakShortName(short, team.name ?? '')) return short
  if (name) return shortNameFromApiTeamName(name)
  return short || '?'
}
