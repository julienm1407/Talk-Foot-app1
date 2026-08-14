import type { Match, Team } from '../types/match'
import { findNationByName, getNationByIso } from '../data/nations'
import { isWorldCupCompetitionId } from './seasonMode'

export type SideColors = { primary: string; secondary: string }

/** Palette fallback — 2 couleurs distinctes par club quand SM renvoie du gris générique. */
const CLUB_SPOTLIGHT_PALETTES: ReadonlyArray<[string, string]> = [
  ['#1d4ed8', '#93c5fd'],
  ['#b91c1c', '#fecaca'],
  ['#047857', '#6ee7b7'],
  ['#c2410c', '#fdba74'],
  ['#6d28d9', '#c4b5fd'],
  ['#0e7490', '#67e8f9'],
  ['#a16207', '#fde047'],
  ['#be123c', '#fda4af'],
  ['#4338ca', '#a5b4fc'],
  ['#15803d', '#86efac'],
  ['#9a3412', '#fed7aa'],
  ['#7e22ce', '#e9d5ff'],
]

const BLAND_PRIMARY = new Set(['#111827', '#1f2937', '#374151', '#4b5563'])
const BLAND_SECONDARY = new Set(['#f9fafb', '#ffffff', '#e5e7eb', '#f3f4f6'])

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

function normalizeHex(color: string): string {
  return color.trim().toLowerCase()
}

function isBlandClubColors(colors: SideColors): boolean {
  return (
    BLAND_PRIMARY.has(normalizeHex(colors.primary)) &&
    BLAND_SECONDARY.has(normalizeHex(colors.secondary))
  )
}

function paletteForClubSeed(seed: string, offset = 0): SideColors {
  const idx = (hashSeed(seed) + offset) % CLUB_SPOTLIGHT_PALETTES.length
  const [primary, secondary] = CLUB_SPOTLIGHT_PALETTES[idx]!
  return { primary, secondary }
}

function teamColorSeed(team: Team): string {
  return team.id || String(team.sportMonksTeamId ?? '') || team.name
}

function nationForTeam(team: Team) {
  if (team.shortName?.length === 3) {
    const byIso = getNationByIso(team.shortName)
    if (byIso) return byIso
  }
  return findNationByName(team.name) ?? findNationByName(team.shortName)
}

/** Sélection nationale reconnue (Coupe du Monde) — pas un club. */
export function isWcNationTeam(team: Team): boolean {
  return nationForTeam(team) != null
}

/** Libellé affiché : nom FR pour les sélections CDM quand connues. */
export function resolveTeamDisplayName(team: Team, competitionId?: string | null): string {
  if (isWorldCupCompetitionId(competitionId)) {
    const nation = nationForTeam(team)
    if (nation) return nation.nameFr
  }
  return team.name
}

/** Applique noms et couleurs FR sur les matchs Coupe du Monde (API SM en anglais). */
export function localizeWcTeam(team: Team): Team {
  const nation = nationForTeam(team)
  if (!nation) return team
  return {
    ...team,
    name: nation.nameFr,
    shortName: nation.iso,
    colors: { primary: nation.primary, secondary: nation.secondary },
  }
}

export function localizeMatchTeams(match: Match): Match {
  if (!isWorldCupCompetitionId(match.competition.id)) return match
  return {
    ...match,
    home: localizeWcTeam(match.home),
    away: localizeWcTeam(match.away),
  }
}

/** Couleurs affichage : nations CDM si compétition Coupe du Monde, sinon palette club. */
export function resolveTeamColors(team: Team, competitionId?: string | null): SideColors {
  if (isWorldCupCompetitionId(competitionId)) {
    const nation = nationForTeam(team)
    if (nation) return { primary: nation.primary, secondary: nation.secondary }
  }
  return team.colors
}

/** Couleurs carte spotlight : nations CDM ou clubs (fallback distinct si gris SM). */
export function resolveSpotlightTeamColors(
  team: Team,
  competitionId?: string | null,
  pairOffset = 0,
): SideColors {
  const base = resolveTeamColors(team, competitionId)
  if (isWorldCupCompetitionId(competitionId) && isWcNationTeam(team)) return base
  if (!isBlandClubColors(base)) return base
  return paletteForClubSeed(teamColorSeed(team), pairOffset)
}

/** Paire home/away avec couleurs toujours distinctes (comme 2 drapeaux CDM). */
export function resolveSpotlightMatchColors(
  home: Team,
  away: Team,
  competitionId?: string | null,
): { home: SideColors; away: SideColors } {
  let homeColors = resolveSpotlightTeamColors(home, competitionId, 0)
  let awayColors = resolveSpotlightTeamColors(away, competitionId, 1)
  if (
    !isWorldCupCompetitionId(competitionId) &&
    homeColors.primary === awayColors.primary &&
    homeColors.secondary === awayColors.secondary
  ) {
    awayColors = paletteForClubSeed(teamColorSeed(away), hashSeed(teamColorSeed(home)) + 3)
  }
  return { home: homeColors, away: awayColors }
}

export function matchSpotlightGradient(
  home: Team,
  away: Team,
  competitionId?: string | null,
): string {
  const sides = resolveSpotlightMatchColors(home, away, competitionId)
  return spotlightGradientFromSides(sides.home, sides.away)
}

/** Dégradé CDM : domicile → centre sombre → extérieur. */
export function spotlightGradientFromSides(home: SideColors, away: SideColors): string {
  return `linear-gradient(125deg, ${home.primary} 0%, ${home.secondary} 38%, #0a0f1a 50%, ${away.secondary} 62%, ${away.primary} 100%)`
}
