import { useRef, type MouseEvent, type PointerEvent } from 'react'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

function stopNav(e: MouseEvent | PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

export function MatchFavoriteButton({
  matchId,
  compact,
  light,
  className,
}: {
  matchId: string
  compact?: boolean
  light?: boolean
  className?: string
}) {
  const { isMatchFavorite, toggleFavoriteMatch, favoriteMatchIds, maxFavoriteMatches } =
    useFanPreferences()
  const toggledByPointer = useRef(false)
  const on = isMatchFavorite(matchId)
  const full = !on && favoriteMatchIds.length >= maxFavoriteMatches
  const label = on
    ? 'Ne plus suivre ce match'
    : full
      ? `Limite atteinte (${maxFavoriteMatches} matchs suivis)`
      : 'Suivre ce match — notification 15 min avant le coup d’envoi'

  const activate = () => {
    if (full) return
    toggleFavoriteMatch(matchId)
  }

  return (
    <span
      className="relative z-30 inline-flex pointer-events-auto"
      onPointerDown={(e) => stopNav(e)}
      onClick={(e) => stopNav(e)}
    >
      <button
        type="button"
        aria-pressed={on}
        aria-label={label}
        title={label}
        disabled={full}
        onPointerDown={(e) => stopNav(e)}
        onPointerUp={(e) => {
          stopNav(e)
          toggledByPointer.current = true
          activate()
        }}
        onClick={(e) => {
          stopNav(e)
          if (toggledByPointer.current) {
            toggledByPointer.current = false
            return
          }
          activate()
        }}
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex shrink-0 items-center justify-center rounded-full border transition',
          compact ? 'size-8' : 'size-9',
          on
            ? light
              ? 'border-amber-400 bg-amber-100 text-amber-700'
              : 'border-amber-300/70 bg-amber-400/20 text-amber-200'
            : light
              ? 'border-slate-300 bg-white/90 text-slate-500 hover:border-amber-400 hover:text-amber-600'
              : 'border-white/25 bg-black/30 text-white/80 hover:border-amber-300/70 hover:text-amber-200',
          full && 'opacity-45',
          className,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={compact ? 'h-4 w-4' : 'h-[1.15rem] w-[1.15rem]'}
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.6l2.95 6.13 6.78.99-4.91 4.66 1.17 6.74L12 17.94l-5.99 3.18 1.17-6.74L2.27 9.72l6.78-.99L12 2.6z" />
        </svg>
      </button>
    </span>
  )
}
