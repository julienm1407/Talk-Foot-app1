import type { Team } from '../../types/match'
import { resolveNationForTeam } from '../../utils/resolveMatchNation'
import { ClubCrest } from './ClubCrest'
import { NationCrest } from './NationCrest'

function nationCrestSizeFromPixels(size: number): 'sm' | 'md' | 'lg' | 'xl' {
  if (size <= 32) return 'sm'
  if (size <= 44) return 'md'
  if (size <= 60) return 'lg'
  return 'xl'
}

/**
 * Écusson club ou drapeau national selon la compétition (CDM → NationCrest).
 */
export function MatchTeamCrest({
  team,
  competitionId,
  size = 40,
  className,
  clickable,
}: {
  team: Team
  competitionId?: string | null
  size?: number
  className?: string
  clickable?: boolean
}) {
  const nation = resolveNationForTeam(team, competitionId)
  if (nation) {
    return (
      <NationCrest
        nation={nation}
        size={nationCrestSizeFromPixels(size)}
        className={className}
      />
    )
  }

  return (
    <ClubCrest
      id={team.id}
      shortName={team.shortName}
      colors={team.colors}
      logoUrl={team.logoUrl}
      sportMonksTeamId={team.sportMonksTeamId}
      size={size}
      className={className}
      clickable={clickable}
    />
  )
}
