import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import {
  MATCH_ALERT_PREF_LABELS,
  type MatchAlertKind,
} from '../../types/fanPreferences'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

function stopNav(e: MouseEvent | PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

const PREF_ORDER: MatchAlertKind[] = ['kickoff', 'goal', 'scorer', 'card', 'halftime', 'fulltime']

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
  const {
    isMatchFavorite,
    toggleFavoriteMatch,
    favoriteMatchIds,
    maxFavoriteMatches,
    matchAlertPrefs,
    setMatchAlertPref,
  } = useFanPreferences()
  const toggledByPointer = useRef(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const on = isMatchFavorite(matchId)
  const full = !on && favoriteMatchIds.length >= maxFavoriteMatches
  const prefs = matchAlertPrefs(matchId)
  const label = on
    ? 'Notifications de ce match'
    : full
      ? `Limite atteinte (${maxFavoriteMatches} matchs suivis)`
      : 'Suivre ce match — choisir les notifications'

  const activate = () => {
    if (full) return
    if (on) {
      setPrefsOpen((v) => !v)
      return
    }
    toggleFavoriteMatch(matchId)
    setPrefsOpen(true)
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
        aria-expanded={on ? prefsOpen : undefined}
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
      {on && prefsOpen ? (
        <div
          className={cn(
            'absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[16.5rem] rounded-xl border p-2.5 shadow-xl',
            light
              ? 'border-slate-200 bg-white text-slate-800'
              : 'border-white/15 bg-[#0b2440] text-sky-50',
          )}
          role="dialog"
          aria-label="Notifications du match"
        >
          <p className={cn('mb-1.5 text-[10px] font-black uppercase tracking-wide', light ? 'text-slate-500' : 'text-sky-200/80')}>
            Notifications
          </p>
          <ul className="space-y-1">
            {PREF_ORDER.map((key) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-[11px] font-semibold">
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => setMatchAlertPref(matchId, key, e.target.checked)}
                    className="size-3.5 accent-amber-400"
                  />
                  {MATCH_ALERT_PREF_LABELS[key]}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={cn(
              'mt-2 w-full rounded-lg border px-2 py-1.5 text-[11px] font-bold',
              light
                ? 'border-slate-200 bg-slate-50 text-slate-700'
                : 'border-white/15 bg-white/5 text-sky-100',
            )}
            onClick={() => {
              toggleFavoriteMatch(matchId)
              setPrefsOpen(false)
            }}
          >
            Ne plus suivre ce match
          </button>
        </div>
      ) : null}
    </span>
  )
}
