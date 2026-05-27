import type { Match } from '../../types/match'
import { useLiveMatchSalonStats } from '../../hooks/useLiveMatchSalonStats'

/** Pied de carte match : spectateurs / messages réels du tribune live (plus de « Xk fans » simulé). */
export function SalonAudienceFooter({
  match,
  className,
}: {
  match: Match
  className?: string
}) {
  const stats = useLiveMatchSalonStats(match.id)

  let label: string
  if (stats && stats.participantsCount > 0) {
    label = `${stats.participantsCount.toLocaleString('fr-FR')} en ligne · ${stats.messagesCount.toLocaleString('fr-FR')} msg · ${match.competition.shortName}`
  } else if (stats) {
    label = `Tribune live · ${match.competition.shortName}`
  } else {
    label = match.competition.shortName
  }

  return (
    <span className={className}>
      {label}
    </span>
  )
}
