import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveMirrorForCard } from '../../types/liveSimulation'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'

/** DA hub TalkFoot — même visuel partout (desktop, mobile, carrousel, colonnes). */
export const HUB_STADIUM_URL =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=75&auto=format&fit=crop'

export function formatHubDayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const t1 = t0 + 86400000
  const t = d.getTime()
  if (t >= t0 && t < t1) return "Aujourd'hui"
  if (t >= t1 && t < t1 + 86400000) return 'Demain'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)
}

export function hubFansK(m: Match) {
  return 8 + (m.home.shortName.length + m.away.shortName.length) * 0.42
}

export function HubMatchProgressBar({ minute, className }: { minute: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (minute / 90) * 100))
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-black/45', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.55)] transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function liveRimClass(rim: LiveMirrorForCard['rim']) {
  if (rim === 'yellow') return 'ring-2 ring-amber-400/75 ring-offset-2 ring-offset-[#030b18] tf-live-rim-pulse'
  if (rim === 'red') return 'ring-2 ring-red-500/80 ring-offset-2 ring-offset-[#030b18] tf-live-rim-pulse'
  if (rim === 'goal')
    return 'ring-2 ring-amber-200/70 shadow-[0_0_28px_rgba(250,204,21,0.22)] ring-offset-2 ring-offset-[#030b18]'
  if (rim === 'var') return 'ring-2 ring-violet-400/65 ring-offset-2 ring-offset-[#030b18]'
  return ''
}

function StripScore({
  home,
  away,
  bumpSide,
  className,
}: {
  home: number
  away: number
  bumpSide: 'home' | 'away' | null
  className?: string
}) {
  return (
    <p className={cn('font-display text-2xl font-black tabular-nums text-white drop-shadow-lg', className)}>
      <span className={cn('inline-block', bumpSide === 'home' ? 'tf-score-pop' : '')}>{home}</span>
      <span className="mx-0.5 font-normal opacity-80">–</span>
      <span className={cn('inline-block', bumpSide === 'away' ? 'tf-score-pop' : '')}>{away}</span>
    </p>
  )
}

const stripLinkBase =
  'group tf-card-hover relative flex w-full min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] outline-none transition-[box-shadow,transform] focus-visible:ring-2 focus-visible:ring-sky-400/50'

const imageAreaH = 'h-[132px]'
const crestMd = 36
const crestSm = 28

export function HubStripLive({
  match,
  liveMirror,
  className,
  showProgress = true,
}: {
  match: Match
  liveMirror?: LiveMirrorForCard
  className?: string
  /** Désactivé sur le rail ultra-compact */
  showProgress?: boolean
}) {
  const sim = match.status === 'live' && liveMirror?.active ? liveMirror : null
  const minute = sim ? sim.minute : match.minute ?? 0
  const sc = sim ? sim.score : match.score ?? { home: 0, away: 0 }
  const bump = sim?.bumpSide ?? null
  const fans = hubFansK(match)
  const rim = liveRimClass(sim?.rim ?? null)

  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(stripLinkBase, rim, className)}
      aria-label={`${match.home.shortName} contre ${match.away.shortName}, en direct`}
    >
      <div className={cn('relative shrink-0 overflow-hidden', imageAreaH)}>
        <img
          src={HUB_STADIUM_URL}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover blur-[2px] transition duration-500 group-hover:scale-[1.08] group-hover:blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#030b18]/65 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg ring-1 ring-rose-400/60">
          <span className="size-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
        {sim?.burst?.kind === 'goal' ? (
          <span className="absolute right-3 top-3 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase text-amber-950 shadow">
            But !
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-2 px-3 pb-1 pt-6">
            <div className="flex min-w-0 items-center gap-2">
              <ClubCrest id={match.home.id} shortName={match.home.shortName} colors={match.home.colors} size={crestMd} />
              <span className="truncate text-xs font-black text-white drop-shadow-md">{match.home.shortName}</span>
            </div>
            <div className="flex shrink-0 flex-col items-center px-1">
              <StripScore home={sc.home} away={sc.away} bumpSide={bump} className="text-xl sm:text-2xl" />
              <span className="mt-0.5 rounded-md bg-emerald-500/95 px-2 py-0.5 text-[10px] font-black text-white shadow">
                {formatRelativeMinute(minute) ?? `${minute}′`}
              </span>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2 text-right">
              <span className="truncate text-xs font-black text-white drop-shadow-md">{match.away.shortName}</span>
              <ClubCrest id={match.away.id} shortName={match.away.shortName} colors={match.away.colors} size={crestMd} />
            </div>
          </div>
          {showProgress ? (
            <div className="px-3 pb-2 pt-0.5">
              <HubMatchProgressBar minute={minute} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#071422]/90 px-3 py-2.5">
        <span className="truncate text-[11px] font-semibold text-white/60">
          {(fans * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k fans
        </span>
        <span className="shrink-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-[0_4px_16px_rgba(14,165,233,0.4)] transition group-hover:from-sky-400 group-hover:to-blue-500">
          Rejoindre
        </span>
      </div>
    </Link>
  )
}

export function HubStripUpcoming({ match, className }: { match: Match; className?: string }) {
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        stripLinkBase,
        'border-sky-400/25 shadow-[0_12px_40px_rgba(14,165,233,0.18)]',
        className,
      )}
      aria-label={`${match.home.shortName} contre ${match.away.shortName}, à venir`}
    >
      <div className={cn('relative shrink-0 overflow-hidden', imageAreaH)}>
        <img
          src={HUB_STADIUM_URL}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover blur-[2px] transition duration-500 group-hover:scale-[1.06] group-hover:blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#061a2e]/85 to-sky-950/40" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg ring-1 ring-sky-400/50">
          À venir
        </span>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ClubCrest id={match.home.id} shortName={match.home.shortName} colors={match.home.colors} size={crestMd} />
            <span className="truncate text-xs font-black text-white drop-shadow-md">{match.home.shortName}</span>
          </div>
          <div className="flex shrink-0 flex-col items-center px-1">
            <p className="font-display text-lg font-black tabular-nums text-white drop-shadow-lg">{formatKickoff(match.kickoffAt)}</p>
            <span className="mt-0.5 rounded-md bg-sky-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow">
              {formatHubDayLabel(match.kickoffAt)}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <span className="truncate text-xs font-black text-white drop-shadow-md">{match.away.shortName}</span>
            <ClubCrest id={match.away.id} shortName={match.away.shortName} colors={match.away.colors} size={crestMd} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#071422]/90 px-3 py-2.5">
        <span className="line-clamp-1 text-[11px] font-semibold text-white/60">{match.competition.shortName}</span>
        <span className="shrink-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-[0_4px_16px_rgba(14,165,233,0.35)] transition group-hover:from-sky-400 group-hover:to-blue-500">
          Voir le salon
        </span>
      </div>
    </Link>
  )
}

export function HubStripFinished({ match, className }: { match: Match; className?: string }) {
  const sc = match.score ?? { home: 0, away: 0 }
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(stripLinkBase, 'border-white/15 opacity-[0.92]', className)}
      aria-label={`${match.home.shortName} contre ${match.away.shortName}, terminé`}
    >
      <div className={cn('relative shrink-0 overflow-hidden', imageAreaH)}>
        <img
          src={HUB_STADIUM_URL}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover blur-[2px] grayscale-[0.25] transition duration-500 group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#030b18]/70 to-transparent" />
        <span className="absolute left-3 top-3 rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/25">
          Terminé
        </span>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ClubCrest id={match.home.id} shortName={match.home.shortName} colors={match.home.colors} size={crestMd} />
            <span className="truncate text-xs font-black text-white drop-shadow-md">{match.home.shortName}</span>
          </div>
          <div className="flex shrink-0 flex-col items-center px-1">
            <p className="font-display text-2xl font-black tabular-nums text-white drop-shadow-lg">
              {sc.home} – {sc.away}
            </p>
            <span className="mt-0.5 text-[10px] font-bold text-white/55">Score final</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <span className="truncate text-xs font-black text-white drop-shadow-md">{match.away.shortName}</span>
            <ClubCrest id={match.away.id} shortName={match.away.shortName} colors={match.away.colors} size={crestMd} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#071422]/90 px-3 py-2.5">
        <span className="line-clamp-1 text-[11px] font-semibold text-white/60">{match.competition.shortName}</span>
        <span className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white transition group-hover:bg-white/15">
          Salon
        </span>
      </div>
    </Link>
  )
}

/** Sélecteur strip pour carrousel / calendrier */
export function HubMatchStrip({
  match,
  liveMirror,
  className,
}: {
  match: Match
  liveMirror?: LiveMirrorForCard
  className?: string
}) {
  if (match.status === 'live') return <HubStripLive match={match} liveMirror={liveMirror} className={className} />
  if (match.status === 'upcoming') return <HubStripUpcoming match={match} className={className} />
  return <HubStripFinished match={match} className={className} />
}

/** Rangée compacte rail (sidebar droite desktop) — même DA, hauteur réduite */
export function HubRailRowUpcoming({ match, className }: { match: Match; className?: string }) {
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group flex w-full min-w-0 items-stretch gap-0 overflow-hidden rounded-xl border border-white/10 bg-[#050d18]/90 shadow-md outline-none transition hover:border-sky-400/35 focus-visible:ring-2 focus-visible:ring-sky-400/45',
        className,
      )}
    >
      <div className="relative w-[76px] shrink-0 overflow-hidden">
        <img src={HUB_STADIUM_URL} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050d18]" />
        <span className="absolute left-1 top-1 rounded bg-sky-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">
          À venir
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2.5 py-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest id={match.home.id} shortName={match.home.shortName} colors={match.home.colors} size={crestSm} />
            <span className="truncate text-[11px] font-black text-white">{match.home.shortName}</span>
          </div>
          <span className="shrink-0 text-[10px] font-black text-emerald-400">{formatKickoff(match.kickoffAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest id={match.away.id} shortName={match.away.shortName} colors={match.away.colors} size={crestSm} />
            <span className="truncate text-[11px] font-black text-white">{match.away.shortName}</span>
          </div>
          <span className="shrink-0 text-[9px] font-bold text-white/45">{formatHubDayLabel(match.kickoffAt)}</span>
        </div>
        <span className="truncate text-[9px] font-semibold text-white/40">{match.competition.shortName}</span>
      </div>
    </Link>
  )
}

export function HubRailRowLive({ match, className }: { match: Match; className?: string }) {
  const sc = match.score ?? { home: 0, away: 0 }
  const min = match.minute ?? 0
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group flex w-full min-w-0 items-stretch gap-0 overflow-hidden rounded-xl border border-rose-500/30 bg-[#050d18]/90 shadow-md outline-none transition hover:border-rose-400/45 focus-visible:ring-2 focus-visible:ring-rose-400/45',
        className,
      )}
    >
      <div className="relative w-[76px] shrink-0 overflow-hidden">
        <img src={HUB_STADIUM_URL} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050d18]" />
        <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">
          <span className="size-1 animate-pulse rounded-full bg-white" />
          Live
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2.5 py-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest id={match.home.id} shortName={match.home.shortName} colors={match.home.colors} size={crestSm} />
            <span className="truncate text-[11px] font-black text-white">{match.home.shortName}</span>
          </div>
          <span className="shrink-0 font-display text-sm font-black tabular-nums text-white">
            {sc.home}–{sc.away}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest id={match.away.id} shortName={match.away.shortName} colors={match.away.colors} size={crestSm} />
            <span className="truncate text-[11px] font-black text-white">{match.away.shortName}</span>
          </div>
          <span className="shrink-0 text-[9px] font-black text-emerald-400">{formatRelativeMinute(min) ?? `${min}′`}</span>
        </div>
      </div>
    </Link>
  )
}

export function HubRailRowMatch({ match, className }: { match: Match; className?: string }) {
  if (match.status === 'live') return <HubRailRowLive match={match} className={className} />
  if (match.status === 'upcoming') return <HubRailRowUpcoming match={match} className={className} />
  const sc = match.score ?? { home: 0, away: 0 }
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group flex w-full min-w-0 items-stretch gap-0 overflow-hidden rounded-xl border border-white/10 bg-[#050d18]/90 shadow-md outline-none transition hover:border-white/20 focus-visible:ring-2 focus-visible:ring-white/25',
        className,
      )}
    >
      <div className="relative w-[76px] shrink-0 overflow-hidden">
        <img src={HUB_STADIUM_URL} alt="" className="absolute inset-0 size-full object-cover grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050d18]" />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2.5 py-2">
        <span className="truncate text-[11px] font-black text-white">
          {match.home.shortName} · {match.away.shortName}
        </span>
        <span className="shrink-0 font-display text-sm font-black tabular-nums text-white/90">
          {sc.home}–{sc.away}
        </span>
      </div>
    </Link>
  )
}
