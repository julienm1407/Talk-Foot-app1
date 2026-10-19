import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSportMonksPlayerRecentMatches } from '../../hooks/useSportMonksPlayerRecentMatches'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import {
  minutesPlayedLabel,
  type PlayerRecentMatch,
} from '../../api/sportMonks/extractPlayerRecentMatchesFromSm'
import { formatKickoffLabel } from '../../utils/time'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export type LineupPlayerPick = {
  playerId: number
  name: string
  photoUrl?: string
  number?: string
  teamId?: string
}

function resultTone(r: PlayerRecentMatch['result']): string {
  if (r === 'W') return 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40'
  if (r === 'L') return 'bg-rose-500/20 text-rose-100 border-rose-400/40'
  return 'bg-white/10 text-sky-100 border-white/20'
}

function resultLabel(r: PlayerRecentMatch['result']): string {
  if (r === 'W') return 'Gagné'
  if (r === 'L') return 'Perdu'
  if (r === 'D') return 'Nul'
  return '—'
}

function MatchRow({ m, light }: { m: PlayerRecentMatch; light?: boolean }) {
  const dateLabel = m.kickoffAt && !Number.isNaN(Date.parse(m.kickoffAt))
    ? formatKickoffLabel(m.kickoffAt, { alwaysDate: true })
    : ''
  const vs = m.isHome ? `vs ${m.opponent}` : `@ ${m.opponent}`
  const bits: string[] = []
  if (m.goals > 0) bits.push(m.goals > 1 ? `${m.goals} buts` : '1 but')
  if (m.assists > 0) bits.push(m.assists > 1 ? `${m.assists} passes` : '1 passe D')
  if (m.yellow > 0) bits.push('jaune')
  if (m.red > 0) bits.push('rouge')

  return (
    <li
      className={cn(
        'rounded-xl border px-3 py-2',
        light ? 'border-slate-200 bg-white/90' : 'border-white/12 bg-white/5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn('truncate text-[11px] font-black', light ? 'text-slate-900' : 'text-white')}>
            {vs}
          </p>
          <p className={cn('text-[10px] font-semibold', light ? 'text-slate-500' : 'text-sky-200/70')}>
            {dateLabel}
            {dateLabel ? ' · ' : ''}
            {m.scoreHome}-{m.scoreAway}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase',
            light
              ? m.result === 'W'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : m.result === 'L'
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              : resultTone(m.result),
          )}
        >
          {resultLabel(m.result)}
        </span>
      </div>
      <p className={cn('mt-1 text-[11px] font-bold', light ? 'text-slate-800' : 'text-sky-50')}>
        {minutesPlayedLabel(m)}
      </p>
      {bits.length ? (
        <p className={cn('mt-0.5 text-[10px] font-semibold', light ? 'text-slate-600' : 'text-sky-200/80')}>
          {bits.join(' · ')}
        </p>
      ) : (
        <p className={cn('mt-0.5 text-[10px] font-medium', light ? 'text-slate-500' : 'text-sky-200/55')}>
          Pas de but ni de passe
        </p>
      )}
    </li>
  )
}

export function MatchLineupPlayerSheet({
  player,
  matchId,
  excludeFixtureId,
  light,
  onClose,
}: {
  player: LineupPlayerPick
  matchId?: string
  excludeFixtureId?: number | null
  light?: boolean
  onClose: () => void
}) {
  const { matches, loading, error } = useSportMonksPlayerRecentMatches(player.playerId, excludeFixtureId)
  const { isPlayerFavorite, toggleFavoritePlayer, favoritePlayers, maxFavoritePlayers } =
    useFanPreferences()
  const following = isPlayerFavorite(player.playerId)
  const playerFollowFull = !following && favoritePlayers.length >= maxFavoritePlayers
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const showPhoto = player.photoUrl && !photoFailed

  return createPortal(
    <div className="fixed inset-0 z-[2147482950]" role="dialog" aria-modal="true" aria-labelledby="tf-player-sheet-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[min(78dvh,36rem)] overflow-y-auto rounded-t-2xl border-t px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl',
          light ? 'border-slate-200 bg-[#f4f7fb]' : 'border-white/15 bg-[#071525]',
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden />
        <div className="mb-3 flex items-center gap-3">
          <div
            className={cn(
              'h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-white',
              light ? 'border-slate-200' : 'border-white/40',
            )}
          >
            {showPhoto ? (
              <img
                src={player.photoUrl}
                alt=""
                className="h-full w-full object-cover object-top"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-sm font-black',
                  light ? 'bg-sky-100 text-sky-900' : 'bg-[#0a1f35] text-sky-100',
                )}
              >
                {player.number ?? player.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-[10px] font-black uppercase tracking-wide', light ? 'text-slate-500' : 'text-sky-300/80')}>
              Derniers matchs
            </p>
            <h2
              id="tf-player-sheet-title"
              className={cn('truncate font-display text-lg font-black', light ? 'text-slate-900' : 'text-white')}
            >
              {player.number ? `${player.number} · ` : ''}
              {player.name}
            </h2>
          </div>
          {player.teamId ? (
            <button
              type="button"
              disabled={playerFollowFull}
              aria-pressed={following}
              title={
                following
                  ? 'Ne plus suivre ce joueur'
                  : 'Suivre ce joueur — notif 15 min avant ses matchs'
              }
              onClick={() => {
                if (!player.teamId || playerFollowFull) return
                toggleFavoritePlayer(
                  { playerId: player.playerId, name: player.name, teamId: player.teamId },
                  matchId,
                )
              }}
              className={cn(
                TF_FOCUS_VISIBLE,
                'rounded-full border px-3 py-1.5 text-[11px] font-black',
                following
                  ? light
                    ? 'border-amber-400 bg-amber-100 text-amber-800'
                    : 'border-amber-300/60 bg-amber-400/20 text-amber-100'
                  : light
                    ? 'border-slate-300 bg-white text-slate-800'
                    : 'border-white/20 bg-white/10 text-white',
                playerFollowFull && 'opacity-45',
              )}
            >
              {following ? '★ Suivi' : '☆ Suivre'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              TF_FOCUS_VISIBLE,
              'rounded-full border px-3 py-1.5 text-[11px] font-black',
              light ? 'border-slate-300 bg-white text-slate-800' : 'border-white/20 bg-white/10 text-white',
            )}
          >
            Fermer
          </button>
        </div>

        {loading ? (
          <p className={cn('py-6 text-center text-sm font-semibold', light ? 'text-slate-600' : 'text-sky-200/80')}>
            Chargement des matchs…
          </p>
        ) : error ? (
          <p className={cn('py-6 text-center text-sm font-semibold', light ? 'text-rose-700' : 'text-rose-200')}>
            {error}
          </p>
        ) : !matches.length ? (
          <p className={cn('py-6 text-center text-sm font-semibold', light ? 'text-slate-600' : 'text-sky-200/80')}>
            Pas encore de matchs récents pour ce joueur.
          </p>
        ) : (
          <ul className="space-y-2 pb-2">
            {matches.map((m) => (
              <MatchRow key={m.fixtureId} m={m} light={light} />
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  )
}
