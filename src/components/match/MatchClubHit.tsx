import type { MouseEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Match, Team } from '../../types/match'
import { cn } from '../../utils/cn'
import { teamHubPathForMatch } from '../../utils/teamHubRoute'

/** Crest + nom : ouvre la page club sans déclencher le lien tribune parent. */
export function MatchClubHit({
  match,
  team,
  className,
  children,
}: {
  match: Match
  team: Team
  className?: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  const path = teamHubPathForMatch(team, match.competition.id)
  if (!path) {
    return <div className={className}>{children}</div>
  }
  return (
    <div
      role="link"
      tabIndex={0}
      className={cn(className, 'cursor-pointer outline-none')}
      title={`Page ${team.name}`}
      aria-label={`Ouvrir la page ${team.name}`}
      onClick={(e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(path)
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        e.stopPropagation()
        navigate(path)
      }}
    >
      {children}
    </div>
  )
}
