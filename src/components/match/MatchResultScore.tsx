import { cn } from '../../utils/cn'

type PenaltyScore = { home: number; away: number }

const sizeClass = {
  sm: 'text-lg font-black',
  md: 'text-2xl font-black',
  lg: 'text-3xl font-bold',
  xl: 'font-display text-3xl font-black sm:text-4xl',
} as const

/**
 * Score temps réglementaire + prolongations, avec ligne TAB optionnelle en dessous.
 */
export function MatchResultScore({
  home,
  away,
  penaltyScore,
  size = 'lg',
  className,
  scoreClassName,
  penaltyClassName,
  separator = '–',
}: {
  home: number
  away: number
  penaltyScore?: PenaltyScore | null
  size?: keyof typeof sizeClass
  className?: string
  scoreClassName?: string
  penaltyClassName?: string
  separator?: string
}) {
  const showPenalties =
    penaltyScore != null &&
    (penaltyScore.home > 0 || penaltyScore.away > 0 || home === away)

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <p className={cn('tabular-nums leading-none', sizeClass[size], scoreClassName)}>
        {home} {separator} {away}
      </p>
      {showPenalties ? (
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-wide tabular-nums sm:text-[11px]',
            penaltyClassName,
          )}
        >
          TAB {penaltyScore.home}–{penaltyScore.away}
        </p>
      ) : null}
    </div>
  )
}
