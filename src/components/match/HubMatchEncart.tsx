import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation, LiveMirrorForCard } from '../../types/liveSimulation'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'
import { LiveSalonPresenceStrip } from '../home/LiveSalonPresenceStrip'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { formatHubDayLabel, formatKickoff, formatRelativeMinute } from '../../utils/time'

export { formatHubDayLabel }
import { useAppearance } from '../../contexts/AppearanceContext'
import { themeForCompetition } from '../../data/competitionThemes'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'

/** DA hub TalkFoot — même visuel partout (desktop, mobile, carrousel, colonnes). */
export const HUB_STADIUM_URL =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=75&auto=format&fit=crop'

export function hubFansK(m: Match) {
  return 8 + (m.home.shortName.length + m.away.shortName.length) * 0.42
}

export function HubMatchProgressBar({
  minute,
  paused = false,
  className,
}: {
  minute: number
  paused?: boolean
  className?: string
}) {
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
        className={cn(
          'h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.55)]',
          paused ? '' : 'transition-[width] duration-300 ease-linear',
        )}
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

/** `overflow-visible` sur la racine : ombres, ring live et scale hover ne sont plus rognés par le parent scroll */
const stripLinkBase =
  'group tf-card-hover relative flex w-full min-w-0 max-w-full shrink-0 snap-start flex-col overflow-visible rounded-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] outline-none transition-[box-shadow,transform] focus-visible:ring-2 focus-visible:ring-sky-400/50'

const imageAreaH = 'h-[132px]'
const imageAreaHCompact = 'h-[104px]'
/** Colonne « À venir » à côté du live (desktop hub) — plus bas que compact */
const imageAreaHSidebar = 'h-[76px]'
/** Accueil desktop : un peu plus haut que la colonne « à venir » pour aligner les bas (proximité visuelle) */
const imageAreaHHero = 'min-h-[152px] sm:min-h-[168px] xl:min-h-[min(188px,20vh)]'
const crestMd = 36
const crestSm = 28
const crestXs = 24
const crestHero = 32

export function HubStripLive({
  match,
  liveMirror,
  className,
  showProgress = true,
  layout = 'strip',
  visualSize = 'default',
  /** À côté de « À venir » : étire la carte pour aligner les bas de colonne */
  fillColumnHeight = false,
  /** `false` : contenu seul (ex. lien parent article) — même DA image + effets */
  asLink = true,
}: {
  match: Match
  liveMirror?: LiveMirrorForCard
  className?: string
  /** Désactivé sur le rail ultra-compact */
  showProgress?: boolean
  /** `featured` : colonne live desktop — image plus haute, carte étirable avec la grille */
  layout?: 'strip' | 'featured'
  /** `compact` : variante plus basse · `hero` : live accueil desktop (remplit l’encart) */
  visualSize?: 'default' | 'compact' | 'hero'
  fillColumnHeight?: boolean
  asLink?: boolean
}) {
  const sim = match.status === 'live' && liveMirror?.active ? liveMirror : null
  const linearMinute = useLinearDisplayedLiveMinute(match)
  const minute = sim ? sim.minute : linearMinute
  const sc = sim ? sim.score : match.score ?? { home: 0, away: 0 }
  const bump = sim?.bumpSide ?? null
  const fans = hubFansK(match)
  const rim = liveRimClass(sim?.rim ?? null)
  const featured = layout === 'featured'
  const imgBand =
    featured
      ? 'min-h-[min(200px,28vh)] flex-1'
      : visualSize === 'compact'
        ? imageAreaHCompact
        : visualSize === 'hero'
          ? imageAreaHHero
          : imageAreaH
  const crestLive =
    visualSize === 'compact' ? crestSm : visualSize === 'hero' ? crestHero : crestMd

  const simulationForPresence: LiveEncartSimulation = {
    active: Boolean(sim),
    minute,
    score: sc,
    bumpSide: bump,
    burst: sim?.burst ?? null,
    toast: sim?.toast ?? null,
    rim: sim?.rim ?? null,
  }

  const shellClass = cn(
    stripLinkBase,
    rim,
    featured && 'h-full min-h-[280px] flex-1 flex flex-col',
    fillColumnHeight && visualSize === 'hero' && 'h-full min-h-0',
    className,
  )

  const inner = (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-t-2xl',
          imgBand,
          fillColumnHeight && visualSize === 'hero' ? 'min-h-0 flex-1' : 'shrink-0',
        )}
      >
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
          <div
            className={cn(
              'flex items-end justify-between gap-2 px-3 pb-1',
              visualSize === 'compact' ? 'pt-4' : visualSize === 'hero' ? 'pt-4' : 'pt-6',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <ClubCrest
                id={match.home.id}
                shortName={match.home.shortName}
                colors={match.home.colors}
                size={crestLive}
              />
              <span
                className={cn(
                  'truncate font-black text-white drop-shadow-md',
                  visualSize === 'hero' ? 'text-sm' : 'text-xs',
                )}
              >
                {match.home.shortName}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-center px-1">
              <StripScore
                home={sc.home}
                away={sc.away}
                bumpSide={bump}
                className={
                  visualSize === 'compact'
                    ? 'text-lg sm:text-xl'
                    : visualSize === 'hero'
                      ? 'text-lg sm:text-xl xl:text-xl'
                      : 'text-xl sm:text-2xl'
                }
              />
              <span
                className={cn(
                  'mt-0.5 rounded-md bg-emerald-500/95 font-black text-white shadow',
                  visualSize === 'hero' ? 'px-2 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[10px]',
                )}
              >
                {formatRelativeMinute(minute) ?? `${minute}′`}
              </span>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2 text-right">
              <span
                className={cn(
                  'truncate font-black text-white drop-shadow-md',
                  visualSize === 'hero' ? 'text-sm' : 'text-xs',
                )}
              >
                {match.away.shortName}
              </span>
              <ClubCrest
                id={match.away.id}
                shortName={match.away.shortName}
                colors={match.away.colors}
                size={crestLive}
              />
            </div>
          </div>
          {showProgress ? (
            <div
              className={cn(
                'px-3 pt-0.5',
                visualSize === 'compact' ? 'pb-1.5' : visualSize === 'hero' ? 'pb-1.5' : 'pb-2',
              )}
            >
              <HubMatchProgressBar minute={minute} />
            </div>
          ) : null}
        </div>
      </div>
      {visualSize === 'hero' ? (
        <div className="rounded-b-2xl border-t border-white/10 bg-[#071422]/90 px-3 py-2.5">
          <div className="flex flex-col gap-2.5">
            <LiveSalonPresenceStrip match={match} simulation={simulationForPresence} />
            <div className="flex justify-end border-t border-white/5 pt-2">
              <span className="shrink-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-[0_4px_16px_rgba(14,165,233,0.4)] transition group-hover:from-sky-400 group-hover:to-blue-500">
                Rejoindre
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-between gap-2 rounded-b-2xl border-t border-white/10 bg-[#071422]/90 px-3',
            visualSize === 'compact' ? 'py-2' : 'py-2.5',
          )}
        >
          <span className="truncate text-[11px] font-semibold text-sky-100/85">
            {(fans * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k fans
          </span>
          <span
            className={cn(
              'shrink-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 font-black text-white shadow-[0_4px_16px_rgba(14,165,233,0.4)] transition group-hover:from-sky-400 group-hover:to-blue-500',
              visualSize === 'compact' ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs',
            )}
          >
            Rejoindre
          </span>
        </div>
      )}
    </>
  )

  if (asLink) {
    return (
      <Link
        to={`/channel/${match.id}`}
        className={shellClass}
        aria-label={`${match.home.shortName} contre ${match.away.shortName}, en direct`}
      >
        {inner}
      </Link>
    )
  }

  return <div className={shellClass}>{inner}</div>
}

export function HubStripUpcoming({
  match,
  className,
  visualSize = 'default',
  /** Agenda : fond dégradé compétition, sans photo terrain (contraste avec les lives) */
  visualStyle = 'stadium',
}: {
  match: Match
  className?: string
  /**
   * `minimal` : ligne compacte · `subtle` : sous le live (léger) ·
   * `hubCard` : accueil desktop colonne centrale — lisible sans bandeau photo étroit.
   */
  visualSize?: 'default' | 'compact' | 'sidebar' | 'minimal' | 'subtle' | 'hubCard'
  visualStyle?: 'stadium' | 'solid'
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const compTh = themeForCompetition(match.competition.id)
  const solid = visualStyle === 'solid'

  if (visualSize === 'minimal') {
    return (
      <Link
        to={`/channel/${match.id}`}
        className={cn(
          'group flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left outline-none transition',
          L
            ? 'border-tf-dark/12 bg-white/95 shadow-sm hover:border-tf-dark/22 hover:bg-white'
            : 'border-white/11 bg-[#050b14]/92 hover:border-white/22 hover:bg-[#071422]',
          className,
        )}
        aria-label={`${match.home.shortName} contre ${match.away.shortName}, à venir`}
      >
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
          <ClubCrest
            id={match.home.id}
            shortName={match.home.shortName}
            colors={match.home.colors}
            logoUrl={match.home.logoUrl}
            sportMonksTeamId={match.home.sportMonksTeamId}
            size={22}
          />
          <span className={cn('mx-0.5 text-[9px] font-black opacity-35', L ? 'text-tf-dark' : 'text-white')}>
            –
          </span>
          <ClubCrest
            id={match.away.id}
            shortName={match.away.shortName}
            colors={match.away.colors}
            logoUrl={match.away.logoUrl}
            sportMonksTeamId={match.away.sportMonksTeamId}
            size={22}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[11px] font-black leading-tight', L ? 'text-tf-dark' : 'text-white')}>
            {match.home.shortName}
            <span className="mx-1 font-semibold opacity-45">·</span>
            {match.away.shortName}
          </p>
          <p className={cn('truncate text-[9px] font-bold', L ? 'text-tf-dark/55' : 'text-sky-200/72')}>
            {match.competition.shortName}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'font-display text-sm font-black tabular-nums leading-none tracking-tight',
              L ? 'text-tf-dark' : 'text-white',
            )}
          >
            {formatKickoff(match.kickoffAt)}
          </p>
          <p
            className={cn(
              'mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em]',
              L ? 'text-tf-dark/48' : 'text-sky-200/60',
            )}
          >
            {formatHubDayLabel(match.kickoffAt)}
          </p>
        </div>
      </Link>
    )
  }

  if (visualSize === 'subtle') {
    return (
      <Link
        to={`/channel/${match.id}`}
        className={cn(
          'group flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition',
          L
            ? 'border border-transparent hover:border-tf-dark/10 hover:bg-tf-dark/[0.04]'
            : 'border border-transparent hover:border-white/10 hover:bg-white/[0.05]',
          className,
        )}
        aria-label={`${match.home.shortName} contre ${match.away.shortName}, à venir`}
      >
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
          <ClubCrest
            id={match.home.id}
            shortName={match.home.shortName}
            colors={match.home.colors}
            logoUrl={match.home.logoUrl}
            sportMonksTeamId={match.home.sportMonksTeamId}
            size={22}
          />
          <span className={cn('mx-px text-[9px] font-black opacity-35', L ? 'text-tf-dark' : 'text-white')}>
            –
          </span>
          <ClubCrest
            id={match.away.id}
            shortName={match.away.shortName}
            colors={match.away.colors}
            logoUrl={match.away.logoUrl}
            sportMonksTeamId={match.away.sportMonksTeamId}
            size={22}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-[11px] font-black leading-snug',
              L ? 'text-tf-dark/92' : 'text-sky-100/95',
            )}
          >
            {match.home.shortName}
            <span className="mx-0.5 font-semibold opacity-40">·</span>
            {match.away.shortName}
          </p>
          <p className={cn('truncate text-[10px] font-semibold', L ? 'text-tf-dark/55' : 'text-sky-200/70')}>
            {match.competition.shortName}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'font-display text-sm font-black tabular-nums leading-none',
              L ? 'text-tf-dark' : 'text-white',
            )}
          >
            {formatKickoff(match.kickoffAt)}
          </p>
        </div>
      </Link>
    )
  }

  if (visualSize === 'hubCard') {
    return (
      <Link
        to={`/channel/${match.id}`}
        className={cn(
          'group relative isolate flex w-full min-w-0 flex-col overflow-hidden rounded-tf-xl border text-left shadow-sm outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-sky-400/45',
          L
            ? 'border-tf-dark/12 bg-white/[0.98] hover:-translate-y-0.5 hover:border-tf-dark/[0.18] hover:shadow-lg'
            : cn(
                'border-white/[0.09] bg-[#050d18]/95 shadow-[0_12px_44px_rgba(0,0,0,0.42)] ring-1 ring-inset ring-white/[0.05]',
                'hover:-translate-y-0.5 hover:border-sky-300/25 hover:shadow-[0_16px_52px_rgba(0,0,0,0.48)] hover:ring-white/[0.09]',
              ),
          className,
        )}
        aria-label={`${match.home.shortName} contre ${match.away.shortName}, à venir`}
      >
        <HubEncartTopAccent appearance={appearance} competitionId={match.competition.id} preset="upcoming" />
        {!L && compTh ? (
          <>
            <div
              className="pointer-events-none absolute -right-8 -top-4 size-[11rem] rounded-full opacity-[0.18] blur-3xl"
              style={{ background: compTh.accent2 }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-14 -left-10 size-[9rem] rounded-full opacity-[0.11] blur-3xl"
              style={{ background: compTh.accent }}
              aria-hidden
            />
          </>
        ) : L && compTh ? (
          <div
            className="pointer-events-none absolute -right-4 top-10 size-36 rounded-full opacity-[0.2] blur-2xl"
            style={{ background: compTh.accent2 }}
            aria-hidden
          />
        ) : !L ? (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-5%,rgba(56,189,248,0.11),transparent_58%)]"
            aria-hidden
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_80%_0%,rgba(14,165,233,0.08),transparent_50%)]"
            aria-hidden
          />
        )}
        <span
          className={cn(
            'absolute right-3 top-[14px] z-[2] rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] shadow-sm ring-1 backdrop-blur-md',
            L && compTh
              ? cn(compTh.labelBg, compTh.labelText, 'ring-black/[0.06]')
              : L
                ? 'bg-sky-100/95 text-sky-950 ring-sky-300/60'
                : compTh
                  ? 'bg-black/40 text-white/95 ring-white/18'
                  : 'bg-sky-600/90 text-white ring-sky-400/40',
          )}
        >
          À venir
        </span>
        <div className="relative z-[1] flex flex-col gap-3 px-3.5 pb-3 pt-3.5 sm:gap-3.5 sm:px-4 sm:pb-3.5 sm:pt-4">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <ClubCrest
                id={match.home.id}
                shortName={match.home.shortName}
                colors={match.home.colors}
                logoUrl={match.home.logoUrl}
                sportMonksTeamId={match.home.sportMonksTeamId}
                size={34}
              />
              <span className="truncate text-sm font-black leading-tight text-tf-app-fg sm:text-[0.9375rem]">
                {match.home.shortName}
              </span>
            </div>
            <div
              className="mx-0.5 hidden h-11 w-px shrink-0 bg-gradient-to-b from-transparent via-tf-dark/15 to-transparent sm:block dark:from-transparent dark:via-white/18 dark:to-transparent"
              aria-hidden
            />
            <div
              className={cn(
                'flex shrink-0 flex-col items-center rounded-xl border px-2 py-1.5 shadow-inner sm:px-2.5 sm:py-2',
                L
                  ? 'border-tf-dark/10 bg-tf-dark/[0.035]'
                  : 'border-white/12 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
              )}
            >
              <p className="font-display text-base font-black tabular-nums leading-none text-tf-app-fg sm:text-lg">
                {formatKickoff(match.kickoffAt)}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-tf-app-muted">
                {formatHubDayLabel(match.kickoffAt)}
              </p>
            </div>
            <div
              className="mx-0.5 hidden h-11 w-px shrink-0 bg-gradient-to-b from-transparent via-tf-dark/15 to-transparent sm:block dark:from-transparent dark:via-white/18 dark:to-transparent"
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <span className="truncate text-right text-sm font-black leading-tight text-tf-app-fg sm:text-[0.9375rem]">
                {match.away.shortName}
              </span>
              <ClubCrest
                id={match.away.id}
                shortName={match.away.shortName}
                colors={match.away.colors}
                logoUrl={match.away.logoUrl}
                sportMonksTeamId={match.away.sportMonksTeamId}
                size={34}
              />
            </div>
          </div>
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 sm:pt-3',
              L ? 'border-tf-dark/10' : 'border-white/10',
            )}
          >
            <span className="flex min-w-0 items-center gap-2 truncate text-xs font-semibold text-tf-app-muted">
              {compTh ? (
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full ring-2',
                    L ? 'ring-tf-dark/12' : 'ring-white/20',
                  )}
                  style={{ backgroundColor: compTh.accent2 }}
                  aria-hidden
                />
              ) : null}
              {match.competition.shortName}
            </span>
            <span className="shrink-0 rounded-lg bg-gradient-to-b from-sky-500 to-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-[0_4px_18px_rgba(14,165,233,0.38)] transition group-hover:from-sky-400 group-hover:to-blue-500 group-hover:shadow-[0_6px_22px_rgba(14,165,233,0.45)]">
              Voir le salon
            </span>
          </div>
        </div>
      </Link>
    )
  }

  const imgBand =
    visualSize === 'sidebar'
      ? imageAreaHSidebar
      : visualSize === 'compact'
        ? imageAreaHCompact
        : imageAreaH
  const crestUp =
    visualSize === 'sidebar' ? crestXs : visualSize === 'compact' ? crestSm : crestMd
  const isSidebar = visualSize === 'sidebar'

  const solidBackground =
    solid &&
    (compTh
      ? L
        ? `linear-gradient(145deg, ${compTh.accent}12 0%, ${compTh.accent2}20 42%, ${compTh.accent}08 100%)`
        : `linear-gradient(145deg, ${compTh.accent} 0%, ${compTh.accent2} 50%, ${compTh.accent} 100%)`
      : L
        ? 'linear-gradient(145deg, rgba(14,165,233,0.1), rgba(59,130,246,0.16))'
        : 'linear-gradient(145deg, #0f172a 0%, #0369a1 48%, #082f49 100%)')

  const nameCls = (sidebar: boolean) =>
    cn(
      'truncate font-black',
      solid && L ? 'text-tf-dark' : 'text-white drop-shadow-md',
      sidebar ? 'max-w-[3.25rem] text-[10px]' : 'text-xs',
    )
  const scoreTimeCls = cn(
    'font-display font-black tabular-nums',
    solid && L ? 'text-tf-dark' : 'text-white drop-shadow-lg',
    isSidebar ? 'text-sm leading-none' : 'text-lg',
  )
  const dayChipCls = cn(
    'rounded-md font-black shadow',
    solid && L && compTh
      ? cn(compTh.labelBg, compTh.labelText, 'ring-1 ring-black/5')
      : 'bg-sky-500/90 text-white',
    isSidebar ? 'mt-0.5 px-1.5 py-px text-[8px]' : 'mt-0.5 px-2 py-0.5 text-[10px]',
  )

  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        stripLinkBase,
        solid
          ? L
            ? 'border-black/10 shadow-[0_10px_28px_rgba(15,23,42,0.08)]'
            : 'border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.35)]'
          : 'border-sky-400/25 shadow-[0_12px_40px_rgba(14,165,233,0.18)]',
        isSidebar && !solid && 'rounded-xl shadow-[0_8px_24px_rgba(14,165,233,0.12)]',
        isSidebar && solid && 'rounded-xl',
        className,
      )}
      style={
        solid && compTh && !L
          ? { borderColor: `${compTh.accent2}55` }
          : undefined
      }
      aria-label={`${match.home.shortName} contre ${match.away.shortName}, à venir`}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-t-2xl',
          imgBand,
          isSidebar && 'rounded-t-xl',
          solid && 'ring-1 ring-inset ring-white/10',
        )}
        style={typeof solidBackground === 'string' ? { background: solidBackground } : undefined}
      >
        {!solid ? (
          <>
            <img
              src={HUB_STADIUM_URL}
              alt=""
              className="absolute inset-0 size-full scale-110 object-cover blur-[2px] transition duration-500 group-hover:scale-[1.06] group-hover:blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#061a2e]/85 to-sky-950/40" />
          </>
        ) : (
          <>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-28deg, transparent, transparent 11px, rgba(255,255,255,0.045) 11px, rgba(255,255,255,0.045) 12px)',
              }}
              aria-hidden
            />
            <div
              className={cn(
                'pointer-events-none absolute inset-0',
                L ? 'bg-gradient-to-t from-black/[0.07] to-transparent' : 'bg-gradient-to-t from-black/40 to-transparent',
              )}
              aria-hidden
            />
          </>
        )}
        <span
          className={cn(
            'absolute inline-flex items-center gap-0.5 font-black uppercase tracking-wide shadow ring-1',
            solid && compTh && !L
              ? 'bg-white/15 text-white ring-white/25 backdrop-blur-[2px]'
              : solid && compTh && L
                ? cn(compTh.labelBg, compTh.labelText, 'ring-black/8')
                : 'bg-sky-600 text-white ring-sky-400/50',
            isSidebar
              ? 'left-2 top-2 px-1.5 py-0.5 text-[8px]'
              : 'left-3 top-3 gap-1 rounded-md px-2 py-0.5 text-[10px] shadow-lg',
          )}
        >
          À venir
        </span>
        <div
          className={cn(
            'absolute flex items-end justify-between',
            isSidebar ? 'bottom-1 left-2 right-2 gap-1' : 'bottom-2 left-3 right-3 gap-2',
          )}
        >
          <div className={cn('flex min-w-0 items-center', isSidebar ? 'gap-1' : 'gap-2')}>
            <ClubCrest
              id={match.home.id}
              shortName={match.home.shortName}
              colors={match.home.colors}
              logoUrl={match.home.logoUrl}
              sportMonksTeamId={match.home.sportMonksTeamId}
              size={crestUp}
            />
            <span className={nameCls(isSidebar)}>{match.home.shortName}</span>
          </div>
          <div className="flex shrink-0 flex-col items-center px-0.5">
            <p className={scoreTimeCls}>{formatKickoff(match.kickoffAt)}</p>
            <span className={dayChipCls}>{formatHubDayLabel(match.kickoffAt)}</span>
          </div>
          <div className={cn('flex min-w-0 items-center justify-end text-right', isSidebar ? 'gap-1' : 'gap-2')}>
            <span className={nameCls(isSidebar)}>{match.away.shortName}</span>
            <ClubCrest
              id={match.away.id}
              shortName={match.away.shortName}
              colors={match.away.colors}
              logoUrl={match.away.logoUrl}
              sportMonksTeamId={match.away.sportMonksTeamId}
              size={crestUp}
            />
          </div>
        </div>
      </div>
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-t',
          solid && L ? 'border-black/10 bg-white/90' : 'border-white/10 bg-[#071422]/90',
          isSidebar ? 'rounded-b-xl px-2.5 py-1.5' : 'rounded-b-2xl px-3',
          !isSidebar && (visualSize === 'compact' ? 'py-2' : 'py-2.5'),
        )}
      >
        <span
          className={cn(
            'line-clamp-1 font-bold',
            solid && L ? 'text-tf-dark/75' : 'text-sky-100/90',
            isSidebar ? 'text-[10px]' : 'text-[11px]',
          )}
        >
          {match.competition.shortName}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-lg bg-gradient-to-b from-sky-500 to-blue-600 font-black text-white transition group-hover:from-sky-400 group-hover:to-blue-500',
            isSidebar
              ? 'px-2 py-0.5 text-[9px] shadow-[0_2px_10px_rgba(14,165,233,0.28)]'
              : visualSize === 'compact'
                ? 'rounded-xl px-3 py-1 text-[11px] shadow-[0_4px_16px_rgba(14,165,233,0.35)]'
                : 'rounded-xl px-4 py-1.5 text-xs shadow-[0_4px_16px_rgba(14,165,233,0.35)]',
          )}
        >
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
      <div className={cn('relative shrink-0 overflow-hidden rounded-t-2xl', imageAreaH)}>
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
            <ClubCrest
              id={match.home.id}
              shortName={match.home.shortName}
              colors={match.home.colors}
              logoUrl={match.home.logoUrl}
              sportMonksTeamId={match.home.sportMonksTeamId}
              size={crestMd}
            />
            <span className="truncate text-xs font-black text-white drop-shadow-md">{match.home.shortName}</span>
          </div>
          <div className="flex shrink-0 flex-col items-center px-1">
            <p className="font-display text-2xl font-black tabular-nums text-white drop-shadow-lg">
              {sc.home} – {sc.away}
            </p>
            <span className="mt-0.5 text-[10px] font-bold text-sky-100/80">Score final</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <span className="truncate text-xs font-black text-white drop-shadow-md">{match.away.shortName}</span>
            <ClubCrest
              id={match.away.id}
              shortName={match.away.shortName}
              colors={match.away.colors}
              logoUrl={match.away.logoUrl}
              sportMonksTeamId={match.away.sportMonksTeamId}
              size={crestMd}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-b-2xl border-t border-white/10 bg-[#071422]/90 px-3 py-2.5">
        <span className="line-clamp-1 text-[11px] font-bold text-sky-100/90">{match.competition.shortName}</span>
        <span className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white transition group-hover:bg-white/15">
          Salon
        </span>
      </div>
    </Link>
  )
}

/** Sélecteur strip pour carrousel / calendrier (à venir « carte dégradé clubs » : voir `MatchSpotlightCard` sur la page Match) */
export function HubMatchStrip({
  match,
  liveMirror,
  className,
}: {
  match: Match
  liveMirror?: LiveMirrorForCard
  className?: string
}) {
  if (match.status === 'live')
    return (
      <HubStripLive
        match={match}
        liveMirror={liveMirror}
        className={className}
        visualSize="default"
      />
    )
  if (match.status === 'upcoming')
    return <HubStripUpcoming match={match} className={className} />
  return <HubStripFinished match={match} className={className} />
}

/** Rangée compacte rail (sidebar droite desktop) — même DA, hauteur réduite */
export function HubRailRowUpcoming({ match, className }: { match: Match; className?: string }) {
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group flex w-full min-w-0 items-stretch gap-0 overflow-visible rounded-xl border border-white/10 bg-[#050d18]/90 shadow-md outline-none transition hover:border-sky-400/35 focus-visible:ring-2 focus-visible:ring-sky-400/45',
        className,
      )}
    >
      <div className="relative w-[76px] shrink-0 overflow-hidden rounded-l-xl">
        <img src={HUB_STADIUM_URL} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050d18]" />
        <span className="absolute left-1 top-1 rounded bg-sky-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">
          À venir
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 rounded-r-xl bg-[#050d18]/90 px-2.5 py-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest
              id={match.home.id}
              shortName={match.home.shortName}
              colors={match.home.colors}
              logoUrl={match.home.logoUrl}
              sportMonksTeamId={match.home.sportMonksTeamId}
              size={crestSm}
            />
            <span className="truncate text-[11px] font-black text-white">{match.home.shortName}</span>
          </div>
          <span className="shrink-0 text-[10px] font-black text-emerald-400">{formatKickoff(match.kickoffAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest
              id={match.away.id}
              shortName={match.away.shortName}
              colors={match.away.colors}
              logoUrl={match.away.logoUrl}
              sportMonksTeamId={match.away.sportMonksTeamId}
              size={crestSm}
            />
            <span className="truncate text-[11px] font-black text-white">{match.away.shortName}</span>
          </div>
          <span className="shrink-0 text-[9px] font-bold text-sky-100/78">{formatHubDayLabel(match.kickoffAt)}</span>
        </div>
        <span className="truncate text-[9px] font-bold text-sky-200/85">{match.competition.shortName}</span>
      </div>
    </Link>
  )
}

export function HubRailRowLive({ match, className }: { match: Match; className?: string }) {
  const sc = match.score ?? { home: 0, away: 0 }
  const min = useLinearDisplayedLiveMinute(match)
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
            <ClubCrest
              id={match.home.id}
              shortName={match.home.shortName}
              colors={match.home.colors}
              logoUrl={match.home.logoUrl}
              sportMonksTeamId={match.home.sportMonksTeamId}
              size={crestSm}
            />
            <span className="truncate text-[11px] font-black text-white">{match.home.shortName}</span>
          </div>
          <span className="shrink-0 font-display text-sm font-black tabular-nums text-white">
            {sc.home}–{sc.away}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <ClubCrest
              id={match.away.id}
              shortName={match.away.shortName}
              colors={match.away.colors}
              logoUrl={match.away.logoUrl}
              sportMonksTeamId={match.away.sportMonksTeamId}
              size={crestSm}
            />
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
