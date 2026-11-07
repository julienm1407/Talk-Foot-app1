import { cn } from '../../utils/cn'
import { OFFICIAL_LINEUP_HINT_FR, type DisplayedLineupKind } from '../../utils/lineupStatus'

export function MatchLineupStatusNote({
  kind,
  light,
  showOfficialBadge = false,
  className,
}: {
  kind: DisplayedLineupKind
  light?: boolean
  /** Badge « officielle » (avant-match). En live on le cache pour ne pas encombrer. */
  showOfficialBadge?: boolean
  className?: string
}) {
  if (kind === 'official') {
    if (!showOfficialBadge) return null
    return (
      <p
        className={cn(
          'mt-1.5 text-center text-[10px] font-black uppercase tracking-[0.12em]',
          light ? 'text-emerald-800' : 'text-emerald-300',
          className,
        )}
      >
        Composition officielle
      </p>
    )
  }

  const muted = light ? 'text-[#4d6f8d]' : 'text-sky-200/80'

  return (
    <div className={cn('mt-1.5 space-y-0.5 text-center', className)}>
      {kind === 'probable' ? (
        <p
          className={cn(
            'text-[10px] font-black uppercase tracking-[0.12em]',
            light ? 'text-amber-800' : 'text-amber-200',
          )}
        >
          Composition probable
        </p>
      ) : null}
      <p className={cn('text-[10px] font-semibold leading-snug', muted)}>{OFFICIAL_LINEUP_HINT_FR}</p>
    </div>
  )
}
