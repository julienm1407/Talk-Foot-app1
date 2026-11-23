import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import {
  MATCH_ALERT_PREF_LABELS,
  type MatchAlertKind,
} from '../../types/fanPreferences'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'

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
    if (!on) toggleFavoriteMatch(matchId)
    setPrefsOpen(true)
  }

  useEffect(() => {
    if (!prefsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrefsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prefsOpen])

  const portalTarget = prefsOpen ? getModalPortalRoot() : null

  return (
    <span
      className="relative z-30 inline-flex pointer-events-auto"
      onPointerDown={(e) => stopNav(e)}
      onClick={(e) => stopNav(e)}
    >
      <button
        type="button"
        aria-pressed={on}
        aria-haspopup="dialog"
        aria-expanded={prefsOpen}
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
      {prefsOpen && portalTarget
        ? createPortal(
            <div
              className={cn(
                'pointer-events-auto fixed inset-0 z-[2147482955] flex touch-manipulation items-end justify-center overflow-hidden',
                'h-[100dvh] max-h-[100dvh]',
                'p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,calc(var(--tf-sys-bottom-inset,0px)+0.75rem))]',
                'sm:items-center',
              )}
              data-no-swipe="true"
              data-tf-modal="true"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tf-match-alert-title"
              onPointerDown={(e) => stopNav(e)}
              onClick={(e) => stopNav(e)}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                aria-label="Fermer"
                onClick={() => setPrefsOpen(false)}
              />
              <div
                className={cn(
                  'relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl',
                  light ? 'border-slate-200 bg-white text-slate-900' : 'border-white/15 bg-[#0b2440] text-sky-50',
                )}
              >
                <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-3">
                  <div className="min-w-0">
                    <p
                      id="tf-match-alert-title"
                      className={cn(
                        'text-[11px] font-black uppercase tracking-[0.16em]',
                        light ? 'text-slate-500' : 'text-sky-200/80',
                      )}
                    >
                      Notifications
                    </p>
                    <p className="mt-0.5 text-sm font-bold">Choisis ce que tu veux recevoir</p>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      TF_FOCUS_VISIBLE,
                      'inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none',
                      light ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/15 bg-white/5 text-sky-100',
                    )}
                    aria-label="Fermer"
                    onClick={() => setPrefsOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-2">
                  {PREF_ORDER.map((key) => (
                    <li key={key}>
                      <label
                        className={cn(
                          'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold',
                          light ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#071525]',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={prefs[key]}
                          onChange={(e) => setMatchAlertPref(matchId, key, e.target.checked)}
                          className="size-4 shrink-0 accent-amber-400"
                        />
                        {MATCH_ALERT_PREF_LABELS[key]}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="shrink-0 space-y-2 border-t px-3 py-3" style={light ? { borderColor: '#e2e8f0' } : { borderColor: 'rgba(255,255,255,0.12)' }}>
                  <button
                    type="button"
                    className="w-full rounded-xl bg-amber-400 px-3 py-2.5 text-sm font-black text-[#3b2500]"
                    onClick={() => setPrefsOpen(false)}
                  >
                    OK
                  </button>
                  {on ? (
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-xs font-bold',
                        light
                          ? 'border-slate-200 bg-white text-slate-700'
                          : 'border-white/15 bg-white/5 text-sky-100',
                      )}
                      onClick={() => {
                        toggleFavoriteMatch(matchId)
                        setPrefsOpen(false)
                      }}
                    >
                      Ne plus suivre ce match
                    </button>
                  ) : null}
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </span>
  )
}
