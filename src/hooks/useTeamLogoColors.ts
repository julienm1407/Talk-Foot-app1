import { useEffect, useMemo, useState } from 'react'
import type { Team } from '../types/match'
import { resolveTeamLogoUrl } from '../utils/catalogLogos'
import { sportMonksTeamLogoUrl } from '../data/sportMonksLogoUrls'
import { extractLogoSideColors } from '../utils/extractLogoColors'
import type { SideColors } from '../utils/matchSideColors'
import { isWcNationTeam } from '../utils/matchSideColors'
import { isWorldCupCompetitionId } from '../utils/seasonMode'

function logoCandidatesForTeam(team: Team): string[] {
  const out: string[] = []
  const primary = resolveTeamLogoUrl(team.id, {
    apiLogoUrl: team.logoUrl,
    sportMonksTeamId: team.sportMonksTeamId,
  })
  if (primary) out.push(primary)
  if (team.logoUrl && team.logoUrl !== primary) out.push(team.logoUrl)
  if (team.sportMonksTeamId != null) {
    const cdn = sportMonksTeamLogoUrl(team.sportMonksTeamId)
    if (cdn && !out.includes(cdn)) out.push(cdn)
  }
  return out
}

/**
 * Couleurs du club extraites du logo (async) — pour dégradé spotlight façon CDM.
 */
export function useTeamLogoColors(team: Team | null | undefined): SideColors | null {
  const candidates = useMemo(
    () => (team ? logoCandidatesForTeam(team) : []),
    [team?.id, team?.logoUrl, team?.sportMonksTeamId],
  )
  const [colors, setColors] = useState<SideColors | null>(null)

  useEffect(() => {
    let cancelled = false
    setColors(null)
    if (candidates.length === 0) return

    void (async () => {
      for (const url of candidates) {
        const extracted = await extractLogoSideColors(url)
        if (cancelled) return
        if (extracted) {
          setColors(extracted)
          return
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [candidates.join('|')])

  return colors
}

/** Paire home/away : priorise logos, sinon `fallback`. CDM = drapeaux nations ; clubs = logos. */
export function useMatchSpotlightLogoColors(
  home: Team,
  away: Team,
  fallback: { home: SideColors; away: SideColors },
  competitionId?: string | null,
): { home: SideColors; away: SideColors; fromLogos: boolean } {
  const isWc = isWorldCupCompetitionId(competitionId)
  const homeLogo = useTeamLogoColors(isWc && isWcNationTeam(home) ? null : home)
  const awayLogo = useTeamLogoColors(isWc && isWcNationTeam(away) ? null : away)
  return {
    home: homeLogo ?? fallback.home,
    away: awayLogo ?? fallback.away,
    fromLogos: Boolean(homeLogo || awayLogo),
  }
}
