import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveMirrorForCard } from '../../types/liveSimulation'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { formatKickoff } from '../../utils/time'
import { themeForCompetition } from '../../data/competitionThemes'
import { isWorldCupCompetitionId } from '../../utils/seasonMode'
import {
  matchSpotlightGradient,
  resolveTeamColors,
  resolveTeamDisplayName,
} from '../../utils/matchSideColors'
import { formatHubDayLabel, HubStripLive } from './HubMatchEncart'
import { MatchTeamBackdrop, patternFor } from './MatchTeamBackdrop'
import { SalonAudienceFooter } from './SalonAudienceFooter'

function fixtureMetaLine(match: Match): string | null {
  const bits = [match.stageName, match.roundName, match.venueName].filter(Boolean)
  return bits.length ? bits.join(' · ') : null
}

const SPOTLIGHT_SCRIM_DEFAULT =
  'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.5))'

/** Voile centré mobile grille — garde les couleurs sur les bords, assombrit le texte au milieu. */
function SpotlightScrim({ grid }: { grid: boolean }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-90"
        style={{ background: SPOTLIGHT_SCRIM_DEFAULT }}
        aria-hidden
      />
      {grid ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] md:hidden"
          style={{
            background:
              'radial-gradient(ellipse 90% 85% at 50% 42%, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.22) 52%, transparent 72%)',
          }}
          aria-hidden
        />
      ) : null}
    </>
  )
}

const gridTextShadow = 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)] md:drop-shadow-md'

/**
 * Carte « À l’affiche » / calendrier : **live** = strip stade global (`HubStripLive`) ; **à venir** = dégradé clubs ; **terminé** = variante débrief.
 */
export function MatchSpotlightCard({
  match,
  liveMirror,
  className,
  density = 'default',
}: {
  match: Match
  liveMirror?: LiveMirrorForCard
  className?: string
  /** `grid` : 2 colonnes mobile (calendrier) — carte plus compacte sous `md`. */
  density?: 'default' | 'grid'
}) {
  const grid = density === 'grid'
  const comp = themeForCompetition(match.competition.id)
  const isWc = isWorldCupCompetitionId(match.competition.id)
  const compId = match.competition.id
  const homeLabel = resolveTeamDisplayName(match.home, compId)
  const awayLabel = resolveTeamDisplayName(match.away, compId)
  const homeColors = resolveTeamColors(match.home, compId)
  const awayColors = resolveTeamColors(match.away, compId)
  const gradient = matchSpotlightGradient(match.home, match.away, compId)

  if (match.status === 'finished') {
    const fsc = match.score ?? { home: 0, away: 0 }
    return (
      <Link
        to={`/channel/${match.id}`}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border border-tf-dark/10 bg-tf-white shadow-md outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-sky-500/40',
          grid ? 'min-h-0 md:min-h-[220px]' : 'min-h-[220px]',
          className,
        )}
        aria-label={`${homeLabel} contre ${awayLabel}, terminé`}
      >
        <div
          className={cn('relative overflow-hidden', grid ? 'min-h-[100px] p-2.5 md:min-h-[160px] md:p-5' : 'min-h-[160px] p-5')}
        >
          <div className="absolute inset-0 z-0" style={{ background: gradient }} aria-hidden />
          <div
            className={cn(
              'absolute inset-0 z-[1] bg-gradient-to-b from-black/25 via-black/45 to-black/60',
              grid && 'md:from-black/25 md:via-black/45 md:to-black/60',
            )}
            aria-hidden
          />
          {grid ? (
            <div
              className="pointer-events-none absolute inset-0 z-[1] md:hidden"
              style={{
                background:
                  'radial-gradient(ellipse 90% 85% at 50% 42%, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.22) 52%, transparent 72%)',
              }}
              aria-hidden
            />
          ) : null}
          <div className="relative z-[2] flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  'rounded-lg bg-white/20 font-black uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/25',
                  grid ? 'px-1.5 py-0.5 text-[9px] md:px-2 md:py-1 md:text-[10px]' : 'px-2 py-1 text-[10px]',
                )}
              >
                Terminé
              </span>
              {comp ? (
                <span
                  className={cn(
                    'rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide',
                    comp.labelBg,
                    comp.labelText,
                  )}
                >
                  {match.competition.shortName}
                </span>
              ) : (
                <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black text-tf-dark">
                  {match.competition.shortName}
                </span>
              )}
            </div>
            <div
              className={cn(
                'flex flex-1 items-center justify-between gap-3',
                grid ? 'mt-2 md:mt-4' : 'mt-4',
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <ClubCrest
                  id={match.home.id}
                  shortName={match.home.shortName}
                  colors={match.home.colors}
                  logoUrl={match.home.logoUrl}
                  sportMonksTeamId={match.home.sportMonksTeamId}
                  size={grid ? 30 : 44}
                  className={grid ? 'md:!size-11' : undefined}
                />
                <span
                  className={cn(
                    'w-full truncate font-black text-white',
                    grid ? cn('text-[10px]', gridTextShadow, 'md:text-sm lg:text-base') : 'text-sm drop-shadow-md sm:text-base',
                  )}
                >
                  {homeLabel}
                </span>
              </div>
              <div className="shrink-0 text-center">
                <p
                  className={cn(
                    'font-display font-black tabular-nums text-white drop-shadow-lg',
                    grid ? 'text-xl md:text-3xl lg:text-4xl' : 'text-3xl sm:text-4xl',
                  )}
                >
                  {fsc.home}–{fsc.away}
                </p>
                <span className={cn('font-bold text-white/75', grid ? 'mt-0.5 text-[9px] md:mt-1 md:text-[11px]' : 'mt-1 text-[11px]')}>
                  Score final
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <ClubCrest
                  id={match.away.id}
                  shortName={match.away.shortName}
                  colors={match.away.colors}
                  logoUrl={match.away.logoUrl}
                  sportMonksTeamId={match.away.sportMonksTeamId}
                  size={grid ? 30 : 44}
                  className={grid ? 'md:!size-11' : undefined}
                />
                <span
                  className={cn(
                    'w-full truncate font-black text-white',
                    grid ? cn('text-[10px]', gridTextShadow, 'md:text-sm lg:text-base') : 'text-sm drop-shadow-md sm:text-base',
                  )}
                >
                  {awayLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-t border-tf-dark/8 bg-tf-ice/80',
            grid ? 'px-2.5 py-2 md:px-4 md:py-3' : 'px-4 py-3',
          )}
        >
          <span className={cn('font-bold text-tf-dark/75', grid ? 'hidden text-xs md:inline' : 'text-xs')}>
            Tribune & débrief
          </span>
          <span
            className={cn(
              'rounded-xl bg-tf-dark font-black text-white transition group-hover:bg-tf-dark-alt',
              grid ? 'w-full px-2.5 py-1.5 text-center text-[10px] md:w-auto md:px-4 md:py-2 md:text-xs' : 'px-4 py-2 text-xs',
            )}
          >
            Ouvrir
          </span>
        </div>
      </Link>
    )
  }

  if (match.status === 'live') {
    return (
      <HubStripLive
        match={match}
        liveMirror={liveMirror}
        visualSize={grid ? 'compact' : 'default'}
        className={cn(grid ? 'min-h-0 md:min-h-[240px]' : 'min-h-[240px]', className)}
      />
    )
  }

  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.28)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-sky-400/50',
        grid ? 'min-h-0 md:min-h-[240px]' : 'min-h-[240px]',
        className,
      )}
      aria-label={`${homeLabel} contre ${awayLabel}, à venir`}
    >
      <div
        className={cn(
          'relative flex-1 overflow-hidden',
          grid
            ? 'min-h-[108px] p-2.5 md:min-h-[188px] md:p-5 lg:min-h-[200px] lg:p-6'
            : 'min-h-[188px] p-5 sm:min-h-[200px] sm:p-6',
        )}
      >
        <div className="absolute inset-0 z-0" style={{ background: gradient }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <MatchTeamBackdrop
            color={homeColors.primary}
            color2={homeColors.secondary}
            pattern={patternFor(match.home.id ?? match.home.shortName)}
            side="home"
            monogram={match.home.shortName}
            monoFont={grid ? 'clamp(2rem, 14vw, 6.5rem)' : 'clamp(3.5rem, 18vw, 6.5rem)'}
          />
          <MatchTeamBackdrop
            color={awayColors.primary}
            color2={awayColors.secondary}
            pattern={patternFor(match.away.id ?? match.away.shortName)}
            side="away"
            monogram={match.away.shortName}
            monoFont={grid ? 'clamp(2rem, 14vw, 6.5rem)' : 'clamp(3.5rem, 18vw, 6.5rem)'}
          />
        </div>
        <SpotlightScrim grid={grid} />
        <div className="relative z-[2] flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-1 md:gap-2">
            <span
              className={cn(
                'rounded-lg font-black uppercase tracking-wide shadow-md ring-1',
                grid ? 'px-1.5 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-[11px]' : 'px-2.5 py-1 text-[11px]',
                isWc
                  ? 'bg-tf-cdm-gold text-tf-cdm-deep ring-tf-cdm-gold/50'
                  : 'bg-sky-600 text-white ring-sky-400/40',
              )}
            >
              À venir
            </span>
            {comp && isWc ? (
              <span
                className={cn(
                  'rounded-lg border border-tf-cdm-gold/45 bg-tf-cdm-gold/15 font-black uppercase tracking-wide text-tf-cdm-gold shadow-sm',
                  grid ? 'px-1.5 py-0.5 text-[8px] md:px-2 md:py-1 md:text-[10px]' : 'px-2 py-1 text-[10px]',
                )}
              >
                ★ {match.competition.shortName}
              </span>
            ) : comp ? (
              <span
                className={cn(
                  'rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm',
                  comp.labelBg,
                  comp.labelText,
                )}
              >
                {match.competition.shortName}
              </span>
            ) : (
              <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black text-tf-dark">
                {match.competition.shortName}
              </span>
            )}
          </div>

          <div
            className={cn(
              'flex flex-1 items-center justify-between gap-1',
              grid ? 'mt-2 md:mt-5 md:gap-2 lg:gap-4' : 'mt-5 gap-2 sm:gap-4',
            )}
          >
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center text-center',
                grid ? 'gap-1 md:gap-2.5' : 'gap-2.5',
              )}
            >
              <ClubCrest
                id={match.home.id}
                shortName={match.home.shortName}
                colors={match.home.colors}
                logoUrl={match.home.logoUrl}
                sportMonksTeamId={match.home.sportMonksTeamId}
                size={grid ? 30 : 48}
                className={grid ? 'md:!size-12' : undefined}
              />
              <span
                className={cn(
                  'w-full truncate font-black leading-tight text-white',
                  grid
                    ? cn('max-w-[4.5rem] text-[10px]', gridTextShadow, 'md:max-w-[10rem] md:text-sm lg:max-w-[13rem] lg:text-base')
                    : 'max-w-[10rem] text-sm drop-shadow-md sm:max-w-[13rem] sm:text-base',
                )}
              >
                {homeLabel}
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1 px-0.5 md:gap-1.5 md:px-1">
              <p
                className={cn(
                  'font-display font-black tabular-nums text-white drop-shadow-lg',
                  grid ? cn('text-base', gridTextShadow, 'md:text-2xl lg:text-3xl') : 'text-2xl sm:text-3xl',
                )}
              >
                {formatKickoff(match.kickoffAt)}
              </p>
              <span
                className={cn(
                  'rounded-lg bg-white/20 font-black text-white backdrop-blur-sm ring-1 ring-white/25',
                  grid ? 'px-1.5 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-xs' : 'px-2.5 py-1 text-xs',
                )}
              >
                {formatHubDayLabel(match.kickoffAt)}
              </span>
            </div>

            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center text-center',
                grid ? 'gap-1 md:gap-2.5' : 'gap-2.5',
              )}
            >
              <ClubCrest
                id={match.away.id}
                shortName={match.away.shortName}
                colors={match.away.colors}
                logoUrl={match.away.logoUrl}
                sportMonksTeamId={match.away.sportMonksTeamId}
                size={grid ? 30 : 48}
                className={grid ? 'md:!size-12' : undefined}
              />
              <span
                className={cn(
                  'w-full truncate font-black leading-tight text-white',
                  grid
                    ? cn('max-w-[4.5rem] text-[10px]', gridTextShadow, 'md:max-w-[10rem] md:text-sm lg:max-w-[13rem] lg:text-base')
                    : 'max-w-[10rem] text-sm drop-shadow-md sm:max-w-[13rem] sm:text-base',
                )}
              >
                {awayLabel}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div
        className={cn(
          'flex flex-col border-t backdrop-blur-sm',
          grid ? 'gap-1 px-2 py-2 md:gap-2 md:px-4 md:py-3.5' : 'gap-2 px-4 py-3.5',
          isWc
            ? 'border-tf-cdm-gold/35 bg-[#04102a]/95'
            : 'border-white/10 bg-[#050a12]/92',
        )}
      >
        {fixtureMetaLine(match) ? (
          <p
            className={cn(
              'text-center font-semibold leading-snug',
              grid ? 'hidden text-[11px] md:block' : 'text-[11px]',
              isWc ? 'text-tf-cdm-gold/80' : 'text-white/70',
            )}
          >
            {fixtureMetaLine(match)}
          </p>
        ) : null}
        <div
          className={cn(
            'flex items-center justify-between gap-2',
            grid && 'md:gap-3',
          )}
        >
          <SalonAudienceFooter
            match={match}
            className={cn(
              'truncate font-semibold',
              grid ? 'hidden text-xs md:block' : 'text-xs',
              isWc ? 'text-white/75' : 'text-white/65',
            )}
          />
          <span
            className={cn(
              'shrink-0 rounded-xl font-black transition',
              grid
                ? 'w-full px-2 py-1.5 text-center text-[10px] md:w-auto md:px-4 md:py-2 md:text-xs'
                : 'px-4 py-2 text-xs',
              isWc
                ? 'bg-tf-cdm-gold text-tf-cdm-deep hover:bg-tf-cdm-gold/90'
                : 'bg-gradient-to-b from-sky-500 to-blue-600 text-white group-hover:from-sky-400 group-hover:to-blue-500',
            )}
          >
            {isWc ? (grid ? 'CDM →' : 'Tribune CDM →') : grid ? 'Tribune →' : 'Voir la tribune'}
          </span>
        </div>
      </div>
    </Link>
  )
}
