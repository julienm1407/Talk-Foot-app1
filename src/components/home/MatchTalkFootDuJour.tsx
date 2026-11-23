import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { useLiveEncartSimulation } from '../../hooks/useLiveEncartSimulation'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { cn } from '../../utils/cn'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { LiveMatchHero } from './LiveMatchHero'
import { MatchSpotlightCard } from '../match/MatchSpotlightCard'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { isTalkFootMatchToday } from '../../utils/talkFootMatchOfTheDay'

function kickoffCountdownLabel(kickoffIso: string, nowMs: number): string {
  const remaining = Math.max(0, new Date(kickoffIso).getTime() - nowMs)
  const totalSec = Math.floor(remaining / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}j ${hours}h ${mins}min`
  if (hours > 0) return `${hours}h ${String(mins).padStart(2, '0')}min`
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/** Encart unique épinglé en haut de l’accueil. */
export function MatchTalkFootDuJour({
  match,
  className,
}: {
  match: Match
  className?: string
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const simulation = useLiveEncartSimulation(match)
  const live = match.status === 'live'
  const today = isTalkFootMatchToday(match)
  const {
    isMatchFavorite,
    toggleFavoriteMatch,
    setKickoffAlertsEnabled,
    favoriteMatchIds,
    maxFavoriteMatches,
  } = useFanPreferences()
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (today || live) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [today, live])

  const watching = isMatchFavorite(match.id)
  const alertsFull = !watching && favoriteMatchIds.length >= maxFavoriteMatches
  const countdown = useMemo(
    () => (today || live ? null : kickoffCountdownLabel(match.kickoffAt, nowMs)),
    [today, live, match.kickoffAt, nowMs],
  )

  const onNotify = () => {
    if (alertsFull) return
    if (!watching) toggleFavoriteMatch(match.id)
    setKickoffAlertsEnabled(true)
  }

  return (
    <section
      className={cn('min-w-0 space-y-2', className)}
      aria-labelledby="tf-match-du-jour-heading"
    >
      <HubEncartTopAccent appearance={appearance} preset={live ? 'live' : 'upcoming'} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-tf-app-muted">
            Talk Foot
          </p>
          <h2
            id="tf-match-du-jour-heading"
            className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl"
          >
            {today ? 'Match Talk Foot du jour' : 'Le match de la semaine'}
          </h2>
          {!today && countdown ? (
            <p className="mt-0.5 text-[12px] font-bold tabular-nums text-sky-400">
              Coup d’envoi dans {countdown}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {today ? (
            <Link
              to={`/channel/${match.id}`}
              className={cn(TF_FOCUS_VISIBLE, 'text-[11px] font-black text-sky-400 hover:underline')}
            >
              {live ? 'Rejoindre le tchat' : 'Ouvrir le salon'}
            </Link>
          ) : (
            <>
              <Link
                to={`/channel/${match.id}`}
                className={cn(TF_FOCUS_VISIBLE, 'text-[11px] font-black text-sky-400 hover:underline')}
              >
                Ouvrir le salon
              </Link>
              <button
                type="button"
                disabled={alertsFull && !watching}
                onClick={onNotify}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'rounded-full border px-3 py-1 text-[11px] font-black',
                  watching
                    ? L
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                    : L
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-sky-400/40 bg-sky-500/15 text-sky-100',
                  alertsFull && !watching && 'opacity-45',
                )}
              >
                {watching ? 'Alerte activée' : 'Me prévenir'}
              </button>
            </>
          )}
        </div>
      </div>
      {live ? (
        <LiveMatchHero match={match} simulation={simulation} />
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border',
            L ? 'border-tf-dark/10 bg-white/90' : 'border-white/12 bg-white/[0.04]',
          )}
        >
          <MatchSpotlightCard match={match} className="min-h-0 w-full min-w-0" />
        </div>
      )}
    </section>
  )
}
