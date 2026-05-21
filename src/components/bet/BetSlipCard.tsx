import { Link } from 'react-router-dom'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { TokenGlyph } from '../ui/TokenGlyph'
import {
  formatBetOddsFr,
  formatBetPlacedAt,
  formatBetPotentialGain,
  getBetPickTitle,
  getBetStatusMeta,
  matchScoreLine,
} from '../../utils/betDisplay'
import { cn } from '../../utils/cn'

export function BetSlipCard({ bet, match }: { bet: Bet; match: Match | null }) {
  const status = getBetStatusMeta(bet.status)
  const pickTitle = getBetPickTitle(bet, match)
  const odds = formatBetOddsFr(bet.odds)
  const potential = formatBetPotentialGain(bet.stake, bet.odds)
  const score = matchScoreLine(match)
  const homeName = match?.home.shortName ?? '—'
  const awayName = match?.away.shortName ?? '—'
  const comp = match?.competition.shortName ?? ''

  const statusBadgeClass =
    status.tone === 'open'
      ? 'border-amber-500/35 bg-amber-500/15 text-amber-200'
      : status.tone === 'won'
        ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
        : status.tone === 'lost'
          ? 'border-rose-500/35 bg-rose-500/15 text-rose-200'
          : 'border-white/15 bg-white/8 text-sky-200/85'

  return (
    <Link
      to={`/channel/${bet.matchId}`}
      className="group block rounded-2xl border border-[#2a3548] bg-[#141a24] p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition hover:border-[#3d4d66] hover:bg-[#181f2c] sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              'shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
              statusBadgeClass,
            )}
          >
            {status.label}
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
          <p className="text-[15px] font-black leading-snug text-amber-50 group-hover:text-white sm:text-base">
            {pickTitle}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-semibold text-sky-200/80">
            <span className="text-sky-100/90">⚽</span>
            <span>
              {homeName}
              <span className="mx-1 text-sky-300/40">·</span>
              {awayName}
            </span>
            {comp ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-sky-300/45">
                {comp}
              </span>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-[#1e4a7a] px-2.5 py-1.5 text-sm font-black tabular-nums text-white ring-1 ring-sky-400/25">
          {odds}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2">
        <div className="flex items-center gap-3 tabular-nums">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-sky-300/50">
              {homeName}
            </div>
            <div
              className={cn(
                'text-lg font-black leading-none',
                score.live ? 'text-amber-200' : 'text-white',
              )}
            >
              {score.home}
            </div>
          </div>
          <span className="text-xs font-black text-sky-300/40">—</span>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-sky-300/50">
              {awayName}
            </div>
            <div
              className={cn(
                'text-lg font-black leading-none',
                score.live ? 'text-amber-200' : 'text-white',
              )}
            >
              {score.away}
            </div>
          </div>
        </div>
        {score.live ? (
          <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-200">
            Live{score.minute != null ? ` ${score.minute}'` : ''}
          </span>
        ) : match?.status === 'finished' ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-sky-300/45">
            Terminé
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-white/8 pt-3">
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
              <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/70">
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
          ) : (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wide text-sky-300/50">
                Résultat
              </div>
              <div className="mt-0.5 text-sm font-black text-sky-200/70">
                {bet.status === 'lost' ? '0 jeton' : '—'}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-[10px] font-semibold text-sky-300/40">{formatBetPlacedAt(bet.placedAt)}</p>
    </Link>
  )
}
