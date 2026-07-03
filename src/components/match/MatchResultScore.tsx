import { cn } from '../../utils/cn'

type PenaltyScore = { home: number; away: number }

const sizeClass = {
  sm: 'text-lg font-black',
  md: 'text-2xl font-black',
  lg: 'text-3xl font-bold',
  xl: 'font-display text-3xl font-black sm:text-4xl',
} as const

/**
 * Score temps réglementaire + prolongations, avec ligne tirs au but optionnelle en dessous.
 */
export function MatchResultScore({
  home,
  away,
  penaltyScore,
  wentToExtraTime = false,
  size = 'lg',
  className,
  scoreClassName,
  penaltyClassName,
  extraTimeClassName,
  separator = '–',
}: {
  home: number
  away: number
  penaltyScore?: PenaltyScore | null
  wentToExtraTime?: boolean
  size?: keyof typeof sizeClass
  className?: string
  scoreClassName?: string
  penaltyClassName?: string
  extraTimeClassName?: string
  separator?: string
}) {
  const showPenalties =
    penaltyScore != null &&
    (penaltyScore.home > 0 || penaltyScore.away > 0 || home === away)

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <p className={cn('tabular-nums leading-none', sizeClass[size], scoreClassName)}>
        {home} {separator} {away}
      </p>
      {wentToExtraTime ? (
        <span
          className={cn(
            'text-[10px] font-black uppercase tracking-wide',
            extraTimeClassName,
          )}
        >
          Après prolongations
        </span>
      ) : null}
      {showPenalties ? (
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10px] font-black tabular-nums',
            penaltyClassName,
          )}
        >
          Tirs au but : {penaltyScore.home} - {penaltyScore.away}
        </span>
      ) : null}
    </div>
  )
}
