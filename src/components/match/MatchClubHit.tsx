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

  const goClub = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault()
    e.stopPropagation()
    if (!path) return
    navigate(path)
  }

  return (
    <div
      role={path ? 'link' : undefined}
      tabIndex={path ? 0 : undefined}
      className={cn(className, path && 'cursor-pointer outline-none')}
      title={path ? `Page ${team.name}` : undefined}
      aria-label={path ? `Ouvrir la page ${team.name}` : undefined}
      onClickCapture={(e: MouseEvent) => {
        if (!path) return
        goClub(e)
      }}
      onClick={(e: MouseEvent) => {
        if (!path) return
        goClub(e)
      }}
      onKeyDown={(e) => {
        if (!path) return
        if (e.key !== 'Enter' && e.key !== ' ') return
        goClub(e)
      }}
    >
      {children}
    </div>
  )
}
