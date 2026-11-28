import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { useLiveEncartSimulation } from '../../hooks/useLiveEncartSimulation'
import { useLiveMatchClockLabel } from '../../hooks/useLiveMatchClockLabel'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { MatchTeamCrest } from '../brand/MatchTeamCrest'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { formatKickoffLabel } from '../../utils/time'
import { formatKickoffCountdown, kickoffCountdownParts } from '../../utils/kickoffCountdown'

function CountdownCells({ kickoffAt, nowMs }: { kickoffAt: string; nowMs: number }) {
  const p = kickoffCountdownParts(kickoffAt, nowMs)
  const cells =
    p.days > 0
      ? [
          [p.days, 'j'],
          [p.hours, 'h'],
          [p.minutes, 'min'],
          [p.seconds, 's'],
        ]
      : [
          [p.hours, 'h'],
          [p.minutes, 'min'],
          [p.seconds, 's'],
        ]
  return (
    <div className="mt-3 flex flex-wrap items-end justify-center gap-2 sm:gap-3" aria-label={`Coup d’envoi dans ${formatKickoffCountdown(p)}`}>
      {cells.map(([n, unit]) => (
        <div
          key={String(unit)}
          className="min-w-[3.25rem] rounded-2xl border border-white/15 bg-black/35 px-2 py-2 text-center sm:min-w-[4rem] sm:px-3"
        >
          <p className="font-display text-2xl font-black tabular-nums leading-none text-white sm:text-4xl">
            {String(n).padStart(2, '0')}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-sky-200/80">{unit}</p>
        </div>
      ))}
    </div>
  )
}

/** Gros bloc pleine largeur — match du jour (PSG > L1 > C1). */
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
  const finished = match.status === 'finished'
  const upcoming = match.status === 'upcoming'
  const clockLabel = useLiveMatchClockLabel(match)
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (!upcoming) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [upcoming])

  const scoreHome = match.score?.home ?? simulation?.score?.home ?? 0
  const scoreAway = match.score?.away ?? simulation?.score?.away ?? 0
  const tribuneTo = `/channel/${match.id}`
  const pronoTo = `/channel/${match.id}?paris=1`
  const recapTo = `/channel/${match.id}#recap`

  const phaseLabel = useMemo(() => {
    if (live) return 'En direct'
    if (finished) return 'Terminé'
    return 'Prochain match'
  }, [live, finished])

  return (
    <section
      className={cn(
        'relative min-w-0 overflow-hidden rounded-[1.75rem] border shadow-[0_18px_50px_rgba(2,12,28,0.35)]',
        L ? 'border-tf-dark/10' : 'border-white/12',
        className,
      )}
      aria-labelledby="tf-prochain-match-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#071a32] via-[#0a2744] to-[#041018]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-tf-cta/25 blur-3xl" aria-hidden />
      <div className="relative z-[1] px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200/85">
            {match.competition.name}
          </p>
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
              live
                ? 'border-rose-400/50 bg-rose-500/25 text-rose-100'
                : finished
                  ? 'border-white/20 bg-white/10 text-sky-100'
                  : 'border-sky-400/40 bg-sky-500/20 text-sky-50',
            )}
          >
            {live ? 'EN DIRECT' : phaseLabel}
          </span>
        </div>

        <h2 id="tf-prochain-match-heading" className="sr-only">
          {match.home.name} contre {match.away.name}
        </h2>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <MatchTeamCrest team={match.home} competitionId={match.competition.id} size={72} />
            <p className="max-w-[9.5rem] font-display text-sm font-black leading-tight text-white sm:max-w-none sm:text-lg">
              {match.home.name}
            </p>
          </div>
          <div className="px-1 text-center">
            {live || finished ? (
              <p className="font-display text-4xl font-black tabular-nums text-white sm:text-5xl">
                {scoreHome}
                <span className="mx-1.5 text-2xl font-black text-white/45 sm:text-3xl">–</span>
                {scoreAway}
              </p>
            ) : (
              <p className="font-display text-lg font-black text-white/70 sm:text-xl">VS</p>
            )}
            {live ? (
              <p className="mt-1 text-sm font-black tabular-nums text-rose-200">{clockLabel}</p>
            ) : (
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-sky-200/80">
                {formatKickoffLabel(match.kickoffAt, { alwaysDate: true })}
              </p>
            )}
          </div>
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <MatchTeamCrest team={match.away} competitionId={match.competition.id} size={72} />
            <p className="max-w-[9.5rem] font-display text-sm font-black leading-tight text-white sm:max-w-none sm:text-lg">
              {match.away.name}
            </p>
          </div>
        </div>

        {upcoming ? <CountdownCells kickoffAt={match.kickoffAt} nowMs={nowMs} /> : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {upcoming ? (
            <>
              <Link
                to={tribuneTo}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-tf-cta px-5 text-sm font-black text-white shadow-tf-cta sm:flex-none sm:min-w-[16rem]',
                )}
              >
                Rejoindre la tribune
              </Link>
              <Link
                to={pronoTo}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white sm:flex-none sm:min-w-[12rem]',
                )}
              >
                Fais ton prono
              </Link>
            </>
          ) : null}
          {live ? (
            <Link
              to={tribuneTo}
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tf-cta px-5 text-sm font-black text-white shadow-tf-cta sm:w-auto sm:min-w-[18rem]',
              )}
            >
              Entrer dans la tribune
            </Link>
          ) : null}
          {finished ? (
            <Link
              to={recapTo}
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tf-cta px-5 text-sm font-black text-white shadow-tf-cta sm:w-auto sm:min-w-[16rem]',
              )}
            >
              Voir le récap
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
