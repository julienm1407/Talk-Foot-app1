import { Link } from 'react-router-dom'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { TokenGlyph } from '../ui/TokenGlyph'
import {
  formatBetOddsFr,
  formatBetPlacedAt,
  formatBetPotentialGain,
  getBetMarketSectionLabel,
  getBetMatchFixtureLabel,
  getBetPickedOutcomeLabel,
  getBetPickedSide,
  getBetPickedTeamLabel,
  matchScoreLine,
} from '../../utils/betDisplay'
import { cn } from '../../utils/cn'

function betStatusLabel(bet: Bet): string {
  if (bet.status === 'won') return 'Gagné'
  if (bet.status === 'lost') return 'Perdu'
  return 'En cours'
}

function betStatusTone(bet: Bet): 'open' | 'won' | 'lost' {
  if (bet.status === 'won') return 'won'
  if (bet.status === 'lost') return 'lost'
  return 'open'
}

export function BetSlipCard({
  bet,
  match,
  matchResolving = false,
}: {
  bet: Bet
  match: Match | null
  matchResolving?: boolean
}) {
  const statusLabel = betStatusLabel(bet)
  const statusTone = betStatusTone(bet)
  const sectionLabel = getBetMarketSectionLabel(bet)
  const pickedOutcome = getBetPickedOutcomeLabel(bet, match)
  const pickedTeam = getBetPickedTeamLabel(bet, match)
  const showPickedTeamLine =
    pickedTeam != null &&
    pickedTeam !== pickedOutcome &&
    bet.market === 'anytime_scorer'
  const matchFixture = matchResolving
    ? 'Chargement du match…'
    : getBetMatchFixtureLabel(match, bet)
  const hasScore = match?.score?.home != null && match?.score?.away != null
  const pickedSide = getBetPickedSide(bet)
  const odds = formatBetOddsFr(bet.odds)
  const potential = formatBetPotentialGain(bet.stake, bet.odds)
  const score = matchScoreLine(match)
  const homeName = match?.home.shortName ?? bet.matchLabel?.homeShort ?? '—'
  const awayName = match?.away.shortName ?? bet.matchLabel?.awayShort ?? '—'
  const comp = match?.competition.shortName ?? bet.matchLabel?.competition ?? ''
  const isWon = bet.status === 'won'
  const isLost = bet.status === 'lost'
  const isSettled = isWon || isLost
  const matchLive = match?.status === 'live'

  const statusBadgeClass =
    statusTone === 'open'
      ? 'border-amber-500/35 bg-amber-500/15 text-amber-200'
      : statusTone === 'won'
        ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-100'
        : 'border-rose-400/45 bg-rose-500/20 text-rose-100'

  const highlightHomeScore =
    pickedSide === 'home' && (isWon || isLost || bet.status === 'open')
  const highlightAwayScore =
    pickedSide === 'away' && (isWon || isLost || bet.status === 'open')

  const scoreTone = (side: 'home' | 'away') => {
    if (!isSettled) return score.live ? 'text-amber-200' : 'text-white'
    if (isWon && pickedSide === side) return 'text-emerald-300'
    if (isLost && pickedSide === side) return 'text-rose-300'
    return 'text-white/55'
  }

  const pickToneClass = cn(
    'mt-0.5 text-[15px] font-black leading-snug sm:text-base',
    isWon && 'text-emerald-100',
    isLost && 'text-rose-100',
    !isSettled && 'text-amber-50 group-hover:text-white',
  )

  const matchPhaseLabel = matchResolving
    ? 'Récupération…'
    : matchLive
      ? 'En cours'
      : match?.status === 'finished'
        ? 'Terminé'
        : 'Match à venir'

  return (
    <Link
      to={`/channel/${bet.matchId}`}
      className={cn(
        'group block rounded-2xl border p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition sm:p-4',
        isWon &&
          'border-emerald-500/45 bg-emerald-950/50 hover:border-emerald-400/55 hover:bg-emerald-950/60 ring-1 ring-emerald-500/20',
        isLost &&
          'border-rose-500/45 bg-rose-950/45 hover:border-rose-400/55 hover:bg-rose-950/55 ring-1 ring-rose-500/20',
        !isSettled &&
          'border-[#2a3548] bg-[#141a24] hover:border-[#3d4d66] hover:bg-[#181f2c]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              'shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
              statusBadgeClass,
            )}
          >
            {statusLabel}
          </span>
          <span className="text-[11px] font-bold text-sky-200/70">Simple</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-black tabular-nums text-amber-200">
            <TokenGlyph className="size-3.5" variant="onDark" />
            {bet.stake}
          </span>
        </div>
        <span className="text-[10px] font-semibold tabular-nums text-sky-300/45">
          {bet.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-300/55">
            {sectionLabel}
          </p>
          <p className={pickToneClass}>{pickedOutcome}</p>
          {showPickedTeamLine ? (
            <p className="mt-1 text-[13px] font-bold text-sky-100/85">{pickedTeam}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-black tabular-nums ring-1',
            isWon && 'bg-emerald-800/60 text-white ring-emerald-400/30',
            isLost && 'bg-rose-900/50 text-white ring-rose-400/30',
            !isSettled && 'bg-[#1e4a7a] text-white ring-sky-400/25',
          )}
        >
          {odds}
        </span>
      </div>

      <div
        className={cn(
          'mt-3 rounded-xl px-3 py-2.5',
          isWon && 'bg-emerald-500/10',
          isLost && 'bg-rose-500/10',
          !isSettled && 'bg-black/25',
        )}
      >
        <p className="text-center text-sm font-black leading-snug text-sky-50">{matchFixture}</p>
        {comp ? (
          <p className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-sky-300/45">
            {comp}
          </p>
        ) : null}
        {hasScore ? (
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center justify-center gap-3 tabular-nums">
              <div className="text-center">
                <div
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wide',
                    highlightHomeScore && isWon && 'text-emerald-300/80',
                    highlightHomeScore && isLost && 'text-rose-300/80',
                    !highlightHomeScore && 'text-sky-300/50',
                  )}
                >
                  {homeName}
                </div>
                <div className={cn('text-lg font-black leading-none', scoreTone('home'))}>
                  {score.home}
                </div>
              </div>
              <span className="text-xs font-black text-sky-300/40">—</span>
              <div className="text-center">
                <div
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wide',
                    highlightAwayScore && isWon && 'text-emerald-300/80',
                    highlightAwayScore && isLost && 'text-rose-300/80',
                    !highlightAwayScore && 'text-sky-300/50',
                  )}
                >
                  {awayName}
                </div>
                <div className={cn('text-lg font-black leading-none', scoreTone('away'))}>
                  {score.away}
                </div>
              </div>
            </div>
            {score.live ? (
              <span className="shrink-0 rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-200">
                Live{score.minute != null ? ` ${score.minute}'` : ''}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-sky-300/45">
                {matchPhaseLabel}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-2 text-center text-[11px] font-semibold text-sky-300/55">
            {matchPhaseLabel}
          </p>
        )}
      </div>

      <div
        className={cn(
          'mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3',
          isWon && 'border-emerald-500/25',
          isLost && 'border-rose-500/25',
          !isSettled && 'border-white/8',
        )}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-sky-300/50">
            Mise
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-black text-white">
            <TokenGlyph className="size-4" variant="onDark" />
            <span className="tabular-nums">{bet.stake} jetons</span>
          </div>
        </div>
        <div className="text-right">
          {bet.status === 'won' && bet.payout != null ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/80">
                Gains
              </div>
              <div className="mt-0.5 text-sm font-black tabular-nums text-emerald-300">
                +{bet.payout} jetons
              </div>
            </>
          ) : bet.status === 'open' ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wide text-amber-300/70">
                Gains potentiels
              </div>
              <div className="mt-0.5 text-sm font-black tabular-nums text-amber-200">
                {potential} jetons
              </div>
            </>
          ) : isLost ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wide text-rose-300/70">
                Gains
              </div>
              <div className="mt-0.5 text-sm font-black tabular-nums text-rose-300/90">0 jeton</div>
            </>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-[10px] font-semibold text-sky-300/40">{formatBetPlacedAt(bet.placedAt)}</p>
    </Link>
  )
}
