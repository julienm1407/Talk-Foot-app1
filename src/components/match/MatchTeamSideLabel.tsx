import type { Nation } from '../../data/nations'
import type { Team } from '../../types/match'
import { resolveNationForTeam } from '../../utils/resolveMatchNation'
import { resolveTeamDisplayName } from '../../utils/matchSideColors'
import { cn } from '../../utils/cn'

function NationFlag({ nation, className }: { nation: Nation; className?: string }) {
  return (
    <span aria-hidden className={cn('shrink-0 text-base leading-none', className)}>
      {nation.flag}
    </span>
  )
}

/** Drapeau + libellé (style WcMatchSummaryCard). */
export function MatchTeamSideLabel({
  label,
  nation,
  team,
  competitionId,
  align = 'left',
  highlight,
  className,
}: {
  label?: string
  nation?: Nation | null
  team?: Team
  competitionId?: string | null
  align?: 'left' | 'right'
  highlight?: boolean
  className?: string
}) {
  const resolvedNation = nation ?? (team ? resolveNationForTeam(team, competitionId) : null)
  const text =
    label ?? (team ? resolveTeamDisplayName(team, competitionId) : 'À déterminer')

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs font-bold text-tf-app-fg',
        align === 'right' && 'flex-row-reverse text-right',
        className,
      )}
    >
      {resolvedNation ? <NationFlag nation={resolvedNation} /> : null}
      <span className={cn('truncate', highlight && 'text-tf-cdm-gold')}>{text}</span>
    </div>
  )
}

/** Ligne compacte « 🇫🇷 France vs 🇧🇷 Brésil » pour listes et encarts. */
export function MatchTeamsVsInline({
  home,
  away,
  competitionId,
  homeHighlight,
  awayHighlight,
  className,
}: {
  home: Team
  away: Team
  competitionId?: string | null
  homeHighlight?: boolean
  awayHighlight?: boolean
  className?: string
}) {
  const homeNation = resolveNationForTeam(home, competitionId)
  const awayNation = resolveNationForTeam(away, competitionId)
  const homeLabel = resolveTeamDisplayName(home, competitionId)
  const awayLabel = resolveTeamDisplayName(away, competitionId)

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1 truncate font-display text-sm font-black text-tf-app-fg',
        className,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-1 truncate">
        {homeNation ? <NationFlag nation={homeNation} /> : null}
        <span className={cn('truncate', homeHighlight && 'text-tf-cdm-gold')}>{homeLabel}</span>
      </span>
      <span className="shrink-0 text-tf-app-muted">vs</span>
      <span className="inline-flex min-w-0 items-center gap-1 truncate">
        {awayNation ? <NationFlag nation={awayNation} /> : null}
        <span className={cn('truncate', awayHighlight && 'text-tf-cdm-gold')}>{awayLabel}</span>
      </span>
    </div>
  )
}
