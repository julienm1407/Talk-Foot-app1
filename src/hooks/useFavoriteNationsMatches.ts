import { useMemo } from 'react'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { useMatches } from '../contexts/MatchesContext'
import { findNationByName, getNationByIso, type Nation } from '../data/nations'
import type { Match } from '../types/match'
import { WC_2026_COMP_ID } from '../utils/seasonMode'

export type FavoriteMatch = {
  match: Match
  /** Nation(s) favorite(s) qui apparaissent dans ce match (1 ou 2). */
  nations: Nation[]
  /** ISO de la nation à mettre en avant (la première trouvée). */
  primaryIso: string
}

type Options = {
  /** Restreindre aux fixtures CDM uniquement (par défaut : oui). */
  competitionId?: string | null
  /** Inclure les matchs déjà terminés (par défaut : false). */
  includeFinished?: boolean
  /** Limite (par défaut : 8). */
  limit?: number
}

/**
 * Retourne les prochains matchs (CDM) des nations favorites de l'utilisateur,
 * triés par kickoff croissant. Matche un fixture si l'home OU l'away
 * correspond — par ISO (futur API) ou par nom EN (compat SportMonks).
 */
export function useFavoriteNationsMatches({
  competitionId = WC_2026_COMP_ID,
  includeFinished = false,
  limit = 8,
}: Options = {}): FavoriteMatch[] {
  const { favoriteNationIsos } = useFanPreferences()
  const { matches } = useMatches()

  return useMemo<FavoriteMatch[]>(() => {
    if (favoriteNationIsos.length === 0) return []

    const favSet = new Set(favoriteNationIsos.map((iso) => iso.toUpperCase()))
    const favNations = favoriteNationIsos
      .map((iso) => getNationByIso(iso))
      .filter((n): n is Nation => !!n)

    const lcNames = new Map<string, Nation>()
    for (const n of favNations) {
      lcNames.set(n.nameEn.toLowerCase(), n)
      lcNames.set(n.nameFr.toLowerCase(), n)
    }

    const isFavTeam = (teamName: string): Nation | null => {
      const lc = teamName.toLowerCase()
      if (lcNames.has(lc)) return lcNames.get(lc)!
      for (const [n, nation] of lcNames) {
        if (lc.includes(n)) return nation
      }
      const guess = findNationByName(teamName)
      if (guess && favSet.has(guess.iso)) return guess
      return null
    }

    const acc: FavoriteMatch[] = []
    for (const m of matches) {
      if (competitionId && m.competition.id !== competitionId) continue
      if (!includeFinished && m.status === 'finished') continue
      const homeNation = isFavTeam(m.home.name)
      const awayNation = isFavTeam(m.away.name)
      if (!homeNation && !awayNation) continue
      const nations: Nation[] = []
      if (homeNation) nations.push(homeNation)
      if (awayNation && awayNation.iso !== homeNation?.iso) nations.push(awayNation)
      acc.push({ match: m, nations, primaryIso: (homeNation ?? awayNation!).iso })
    }

    acc.sort((a, b) => Date.parse(a.match.kickoffAt) - Date.parse(b.match.kickoffAt))
    return acc.slice(0, limit)
  }, [favoriteNationIsos, matches, competitionId, includeFinished, limit])
}

/** Helper utilisé par les cartes de match pour décorer les fixtures favoris. */
export function useFavoriteNationsLookup() {
  const { favoriteNationIsos } = useFanPreferences()

  return useMemo(() => {
    const favSet = new Set(favoriteNationIsos.map((iso) => iso.toUpperCase()))
    const favNations = favoriteNationIsos
      .map((iso) => getNationByIso(iso))
      .filter((n): n is Nation => !!n)
    const lcNames = new Map<string, Nation>()
    for (const n of favNations) {
      lcNames.set(n.nameEn.toLowerCase(), n)
      lcNames.set(n.nameFr.toLowerCase(), n)
    }
    return {
      favSet,
      matchTeam: (teamName: string): Nation | null => {
        const lc = teamName.toLowerCase()
        if (lcNames.has(lc)) return lcNames.get(lc)!
        for (const [n, nation] of lcNames) {
          if (lc.includes(n)) return nation
        }
        const guess = findNationByName(teamName)
        if (guess && favSet.has(guess.iso)) return guess
        return null
      },
    }
  }, [favoriteNationIsos])
}
