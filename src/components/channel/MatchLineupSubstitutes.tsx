import type { LineupPlayerMatchOverlay } from '../../api/sportMonks/extractPlayerMatchOverlaysFromSmFixture'
import type { LineupSubstitutePlayer } from '../../api/sportMonks/extractSubstitutesFromSmFixture'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import { formatLineupRating, lineupRatingBackground } from '../../utils/lineupPlayerRatingColor'

export type LineupSubstituteWithOverlay = LineupSubstitutePlayer & {
  overlay?: LineupPlayerMatchOverlay
}

function playerInitials(name: string): string {
  const parts = name.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function SubRow({
  player,
  align,
  light,
}: {
  player: LineupSubstituteWithOverlay
  align: 'left' | 'right'
  light?: boolean
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const overlay = player.overlay
  const goals = overlay?.goals ?? 0
  const ownGoals = overlay?.ownGoals ?? 0
  const rating = overlay?.rating
  const showPhoto = player.photoUrl && !photoFailed

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <div
        className={cn(
          'relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-white',
          light ? 'border-white/90' : 'border-white/70',
        )}
      >
        {showPhoto ? (
          <img
            src={player.photoUrl}
            alt=""
            className="h-full w-full object-cover object-top"
            loading="lazy"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center text-[7px] font-black',
              light ? 'bg-sky-100 text-sky-900/70' : 'bg-[#0a1f35] text-sky-100/85',
            )}
          >
            {playerInitials(player.label)}
          </div>
        )}
      </div>

      <div className={cn('min-w-0 flex-1', align === 'right' && 'items-end')}>
        <div
          className={cn(
            'flex min-w-0 items-center gap-1',
            align === 'right' && 'flex-row-reverse',
          )}
        >
          <p
            className={cn(
              'truncate text-[10px] font-bold',
              light ? 'text-[#023458]' : 'text-sky-50',
            )}
          >
            {player.shortName}
          </p>

          {rating != null ? (
            <span
              className="flex h-4 min-w-[1.35rem] shrink-0 items-center justify-center rounded px-0.5 text-[8px] font-black leading-none text-white"
              style={{ backgroundColor: lineupRatingBackground(rating) }}
            >
              {formatLineupRating(rating)}
            </span>
          ) : null}

          {(goals > 0 || ownGoals > 0) && (
            <span className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <span
                className={cn(
                  'text-[10px] leading-none',
                  ownGoals > 0 && goals === 0 ? 'text-red-600' : 'text-neutral-800',
                )}
                aria-hidden
              >
                ⚽
              </span>
              {goals > 1 ? (
                <span className="absolute -right-1 -top-0.5 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-neutral-900 px-px text-[6px] font-black text-white">
                  {goals}
                </span>
              ) : null}
            </span>
          )}
        </div>

        <p
          className={cn(
            'mt-0.5 flex items-center gap-0.5 text-[8px] font-medium leading-tight text-sky-200/55',
            align === 'right' && 'justify-end',
          )}
        >
          <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-[2px] border border-sky-200/20 bg-sky-950/40 text-[7px] leading-none">
            ↻
          </span>
          <span className="truncate">
            {align === 'left' ? (
              <>
                {player.replacedShortName} {player.subbedOnMinute}&apos;
              </>
            ) : (
              <>
                {player.subbedOnMinute}&apos; {player.replacedShortName}
              </>
            )}
          </span>
        </p>
      </div>
    </div>
  )
}

export function MatchLineupSubstitutes({
  home,
  away,
  showBothTeams,
  showWhenEmpty,
  light,
  className,
}: {
  home: LineupSubstituteWithOverlay[]
  away: LineupSubstituteWithOverlay[]
  showBothTeams?: boolean
  /** Affiche le titre même sans remplaçant (match live / terminé). */
  showWhenEmpty?: boolean
  light?: boolean
  className?: string
}) {
  const left = showBothTeams ? home : home.length ? home : []
  const right = showBothTeams ? away : away.length ? away : []

  if (!left.length && !right.length && !showWhenEmpty) return null

  return (
    <div className={cn('mt-2 space-y-1.5', className)}>
      <p
        className={cn(
          'text-[9px] font-black uppercase tracking-[0.14em]',
          light ? 'text-sky-900/55' : 'text-sky-100/45',
        )}
      >
        Joueurs remplacés
      </p>
      {!left.length && !right.length ? (
        <p className={cn('text-[9px] font-medium', light ? 'text-sky-900/45' : 'text-sky-200/45')}>
          Aucun remplacement pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-2">
            {left.map((p) => (
              <SubRow
                key={`sub-home-${p.playerId ?? p.label}-${p.subbedOnMinute}`}
                player={p}
                align="left"
                light={light}
              />
            ))}
          </div>
          {(showBothTeams || right.length > 0) && right.length > 0 ? (
            <div className="space-y-2">
              {right.map((p) => (
                <SubRow
                  key={`sub-away-${p.playerId ?? p.label}-${p.subbedOnMinute}`}
                  player={p}
                  align="right"
                  light={light}
                />
              ))}
            </div>
          ) : showBothTeams ? (
            <div />
          ) : null}
        </div>
      )}
    </div>
  )
}
