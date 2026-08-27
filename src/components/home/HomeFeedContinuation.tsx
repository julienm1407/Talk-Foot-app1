import { useMemo, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { NewsItem } from '../../data/news'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { Card } from '../ui/Card'
import { MatchCarousel } from '../match/MatchCarousel'
import { NewsFeed } from './NewsFeed'
import { TopCommentsFeed } from './TopCommentsFeed'
import { BettorLeaderboard } from './BettorLeaderboard'
import { AdSlot } from '../ui/AdSlot'
import { MatchTeamCrest } from '../brand/MatchTeamCrest'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel } from '../../utils/hubSurface'
import { isWorldCupCompetitionId } from '../../utils/seasonMode'
import { teamHubPathForMatch } from '../../utils/teamHubRoute'
/** Infos club pour sous-titres (évite d’imposer tout le type Team depuis les hooks). */
export type HomeFeedTeamHint = { name: string; shortName: string } | null

function HomeResultPreviewCard({ match }: { match: Match }) {
  const { appearance } = useAppearance()
  const navigate = useNavigate()
  const L = appearance === 'light'
  const sc = match.score ?? { home: 0, away: 0 }

  const openClub = (side: 'home' | 'away') => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const team = side === 'home' ? match.home : match.away
    const path = teamHubPathForMatch(team, match.competition.id)
    if (path) navigate(path)
  }

  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group flex min-w-0 flex-col gap-2.5 rounded-tf-xl border p-3 outline-none transition sm:p-3.5',
        L
          ? 'border-tf-dark/12 bg-white/95 shadow-sm hover:border-tf-dark/22 hover:shadow-md'
          : 'border-white/12 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-sky-400/25 hover:bg-white/[0.08]',
      )}
      aria-label={`${match.home.shortName} ${sc.home} à ${sc.away} ${match.away.shortName}, terminé`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide',
            L ? 'bg-tf-dark/[0.07] text-tf-dark/80' : 'bg-white/12 text-sky-100/90',
          )}
        >
          Terminé
        </span>
        <span className="min-w-0 truncate text-[10px] font-bold text-tf-app-muted">
          {match.competition.shortName}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={openClub('home')}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none"
          title={`Page ${match.home.name}`}
        >
          <MatchTeamCrest
            team={match.home}
            competitionId={match.competition.id}
            size={28}
            clickable={false}
          />
          <span className="truncate text-xs font-black text-tf-app-fg underline-offset-2 hover:underline">
            {match.home.shortName}
          </span>
        </button>
        <p className="shrink-0 font-display text-lg font-black tabular-nums text-tf-app-fg sm:text-xl">
          {sc.home}
          <span className="mx-0.5 font-semibold opacity-40">–</span>
          {sc.away}
        </p>
        <button
          type="button"
          onClick={openClub('away')}
          className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right outline-none"
          title={`Page ${match.away.name}`}
        >
          <span className="truncate text-xs font-black text-tf-app-fg underline-offset-2 hover:underline">
            {match.away.shortName}
          </span>
          <MatchTeamCrest
            team={match.away}
            competitionId={match.competition.id}
            size={28}
            clickable={false}
          />
        </button>
      </div>
      <span
        className={cn(
          'text-[11px] font-black transition',
          L ? 'text-sky-700 group-hover:text-sky-900' : 'text-sky-300/95 group-hover:text-white',
        )}
      >
        Tribune →
      </span>
    </Link>
  )
}

/** Carrousel matchs + fil actus / top com. + badges — réutilisé mobile & desktop. */
export function HomeFeedContinuation({
  idPrefix,
  displayMatches,
  heroLiveMatch,
  heroLiveSim,
  personalizedNews,
  articlesLoading = false,
  supporterFocusUi,
  clubFocusLabel,
  team,
  wrapClassName,
  /** Hub 3 colonnes : le fil occupe toute la largeur utile de la colonne centrale (sans `max-w-tf-content`). */
  fullWidth = false,
  contentReady = true,
}: {
  idPrefix: string
  displayMatches: Match[]
  heroLiveMatch: Match | null
  heroLiveSim: LiveEncartSimulation
  personalizedNews: NewsItem[]
  articlesLoading?: boolean
  supporterFocusUi: boolean
  clubFocusLabel: string
  team: HomeFeedTeamHint
  wrapClassName?: string
  fullWidth?: boolean
  contentReady?: boolean
}) {
  const { appearance } = useAppearance()
  const isLight = appearance === 'light'
  const pid = (s: string) => `${idPrefix}${s}`

  const { spotlightMatches, recentFinishedMatches } = useMemo(() => {
    const liveUp = displayMatches.filter((m) => m.status === 'live' || m.status === 'upcoming')
    liveUp.sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    liveUp.sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0))
    const done = displayMatches
      .filter((m) => m.status === 'finished')
      .sort((a, b) => +new Date(b.kickoffAt) - +new Date(a.kickoffAt))
      .slice(0, 6)
    return { spotlightMatches: liveUp, recentFinishedMatches: done }
  }, [displayMatches])

  const onlyResults = spotlightMatches.length === 0 && recentFinishedMatches.length > 0
  const noMatchesBlock = spotlightMatches.length === 0 && recentFinishedMatches.length === 0
  const wcSpotlight = spotlightMatches.some((m) => isWorldCupCompetitionId(m.competition.id))

  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0 space-y-6 sm:space-y-8',
        !fullWidth && 'max-w-tf-content',
        wrapClassName,
      )}
    >
      <div className={cn('rounded-[20px] p-3 sm:p-4 lg:rounded-2xl', hubGlassPanel(appearance))}>
        <section
          className="min-w-0"
          aria-labelledby={
            onlyResults ? pid('home-results-heading') : pid('home-carousel-heading')
          }
        >
          <Card
            className={cn(
              'flex flex-col overflow-visible border-2 p-4 sm:p-5',
              wcSpotlight
                ? 'border-tf-cdm-gold/45 shadow-[0_12px_40px_rgba(244,197,66,0.14)] ring-1 ring-tf-cdm-gold/30'
                : 'border-sky-400/45 shadow-[0_12px_40px_rgba(14,165,233,0.12)] ring-1 ring-sky-300/30',
            )}
            elevation="soft"
          >
            {spotlightMatches.length > 0 ? (
              <MatchCarousel
                matches={spotlightMatches}
                eyebrow={supporterFocusUi && clubFocusLabel ? `Focus ${clubFocusLabel}` : 'Matchs'}
                title={supporterFocusUi && clubFocusLabel ? `À suivre · ${clubFocusLabel}` : 'À suivre'}
                titleId={pid('home-carousel-heading')}
                subtitle={
                  supporterFocusUi && team
                    ? `Autour de ${clubFocusLabel || team.shortName}.`
                    : 'Live et prochains coups d’envoi — chaque carte ouvre la tribune.'
                }
                liveMirror={
                  heroLiveMatch ? { matchId: heroLiveMatch.id, ...heroLiveSim } : undefined
                }
              />
            ) : noMatchesBlock ? (
              <div className="space-y-2 pb-0.5">
                <h2
                  id={pid('home-carousel-heading')}
                  className="font-display text-xl font-black tracking-tight text-tf-app-fg sm:text-2xl"
                >
                  {supporterFocusUi && clubFocusLabel
                    ? `Aucun match · ${clubFocusLabel}`
                    : 'Aucun match dans la fenêtre'}
                </h2>
                <p className="text-sm text-tf-app-muted">
                  {supporterFocusUi && team
                    ? `Élargis le calendrier ou reviens plus tard.`
                    : 'Consulte le calendrier pour voir d’autres dates et ligues.'}
                </p>
                <Link
                  to="/match"
                  className="inline-flex text-sm font-black text-tf-electric-deep underline underline-offset-2"
                >
                  Ouvrir le calendrier
                </Link>
              </div>
            ) : null}

            {recentFinishedMatches.length > 0 ? (
              <div
                className={cn(
                  'min-w-0 space-y-3',
                  spotlightMatches.length > 0 && 'mt-6 border-t border-tf-dark/10 pt-6 dark:border-white/10',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {onlyResults ? (
                    <h2
                      id={pid('home-results-heading')}
                      className="font-display text-xl font-black tracking-tight text-tf-app-fg sm:text-2xl"
                    >
                      Résultats
                    </h2>
                  ) : (
                    <h3
                      id={pid('home-results-heading')}
                      className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl"
                    >
                      Résultats
                    </h3>
                  )}
                  <Link
                    to="/match"
                    className={cn(
                      'shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-black transition sm:text-xs',
                      isLight
                        ? 'border-tf-dark/14 bg-white text-tf-dark hover:border-tf-electric/35'
                        : 'border-white/18 bg-white/[0.08] text-white hover:border-sky-400/40',
                    )}
                  >
                    Calendrier
                  </Link>
                </div>
                <ul
                  className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
                  role="list"
                >
                  {recentFinishedMatches.map((m) => (
                    <li key={m.id} className="min-w-0">
                      <HomeResultPreviewCard match={m} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        </section>

        <section className="mt-3 min-w-0 sm:mt-4 lg:mt-5" aria-labelledby={pid('home-feed-heading')}>
          <Card
            className={cn(
              'flex flex-col gap-5 border-2 p-4 ring-1 sm:gap-6 sm:p-6',
              isLight
                ? 'border-cyan-300/70 ring-cyan-300/45 bg-gradient-to-b from-white/95 via-white to-sky-50/65 shadow-[0_22px_56px_rgba(3,105,161,0.16)]'
                : 'border-cyan-300/30 ring-cyan-300/25 bg-gradient-to-b from-[#071628]/95 via-[#081a30]/95 to-[#051120]/95 shadow-[0_26px_64px_rgba(0,0,0,0.5)]',
            )}
            elevation="soft"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className={cn('text-[11px] font-black uppercase tracking-[0.18em]', isLight ? 'text-sky-700' : 'text-sky-200/85')}>
                  Feed Actus
                </p>
                <h2 id={pid('home-feed-heading')} className="mt-1 font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-[2rem]">
                  {supporterFocusUi && clubFocusLabel ? `Actus ${clubFocusLabel}` : 'Actus'}
                </h2>
              </div>
            </div>
            <div
              id={pid('home-feed-panel')}
              className="flex min-w-0 flex-col gap-6"
            >
              <div className="min-w-0 flex-1">
                <NewsFeed
                  embedded
                  items={personalizedNews}
                  loading={articlesLoading}
                  personalized
                  supporterClubShort={supporterFocusUi ? clubFocusLabel : null}
                />
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-5 min-w-0 sm:mt-6" aria-labelledby={pid('home-comments-heading')}>
          <Card
            className={cn(
              'relative overflow-hidden border p-0',
              isLight
                ? 'border-slate-200/80 bg-white/95 shadow-[0_16px_44px_rgba(15,23,42,0.1)]'
                : 'border-white/12 bg-[#0b1324]/92 shadow-[0_18px_50px_rgba(0,0,0,0.45)]',
            )}
            elevation="soft"
          >
            <div className={cn('relative z-[1] flex min-w-0 flex-col', isLight ? 'bg-white/65' : 'bg-white/[0.02]')}>
              <div className={cn('border-b px-4 py-4 sm:px-6 sm:py-5', isLight ? 'border-slate-200/80' : 'border-white/10')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', isLight ? 'text-slate-500' : 'text-slate-300')}>
                      Communauté
                    </p>
                    <h3 id={pid('home-comments-heading')} className="mt-1 font-display text-xl font-black tracking-tight text-tf-app-fg sm:text-2xl">
                      Top commentaires
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em]',
                      isLight ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
                    )}
                  >
                    Live
                  </span>
                </div>
                <p className={cn('mt-2 text-xs font-semibold', isLight ? 'text-slate-600' : 'text-slate-300')}>
                  Réactions en direct de la communauté.
                </p>
              </div>

              <div className="flex min-w-0 flex-col gap-5 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5 xl:flex-row xl:items-start xl:gap-8">
                <div
                  className={cn(
                    'min-w-0 flex-1 rounded-2xl border p-2 sm:p-3',
                    isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/14 bg-white/[0.04]',
                  )}
                >
                  <TopCommentsFeed embedded />
                </div>
                <aside
                  className={cn(
                    'flex w-full shrink-0 flex-col gap-4 border-t pt-6 xl:w-80 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0',
                    isLight ? 'border-slate-200/80' : 'border-white/12',
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl border p-3',
                      isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/14 bg-white/[0.04]',
                    )}
                  >
                    <BettorLeaderboard embedded />
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl border border-dashed p-4 text-center',
                      isLight ? 'border-slate-300 bg-white/80 text-slate-600' : 'border-white/20 bg-white/[0.03] text-slate-300',
                    )}
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]">Emplacement sponsor</p>
                    <p className="mt-1 text-xs font-semibold">Zone disponible pour pub réelle.</p>
                  </div>
                </aside>
              </div>
            </div>
          </Card>
        </section>

        <div className="mt-5 sm:mt-6">
          <AdSlot
            tone="sky"
            brand="Partenaire carrousel"
            body="Entre le carrousel des matchs et le fil actus / top commentaires."
            imageSeed="home-carousel-feed"
            contentReady={contentReady}
          />
        </div>
      </div>

      <nav
        aria-label="Raccourcis navigation"
        className={cn(
          'rounded-2xl border px-3 py-3 sm:px-4',
          isLight
            ? 'border-tf-dark/10 bg-white/85 shadow-sm'
            : 'border-tf-dark/12 bg-gradient-to-r from-tf-night/[0.06] via-tf-ice/70 to-tf-night/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
        )}
      >
        <p
          className={cn(
            'mb-2.5 text-center text-[10px] font-black uppercase tracking-[0.18em]',
            isLight ? 'text-tf-grey' : 'text-sky-100/90',
          )}
        >
          Accès rapide
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            to="/groups"
            title={supporterFocusUi && clubFocusLabel ? `Tribunes — focus ${clubFocusLabel}` : 'Groupes et tribunes'}
            className={cn(
              'tf-interactive-press inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-[11px] font-black leading-tight sm:min-h-10 sm:text-xs',
              isLight
                ? 'border-tf-dark/14 bg-white text-tf-dark shadow-sm hover:border-tf-electric/30 hover:bg-tf-ice/60'
                : 'border-white/18 bg-white/[0.1] text-white hover:bg-white/[0.16]',
            )}
          >
            <span aria-hidden>👥</span>
            <span className="max-w-[10.5rem] truncate sm:max-w-[13rem]">
              Tribunes
              {supporterFocusUi && clubFocusLabel ? ` · ${clubFocusLabel}` : ''}
            </span>
          </Link>
          <Link
            to="/debates"
            className={cn(
              'tf-interactive-press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-[11px] font-black leading-tight sm:min-h-10 sm:text-xs',
              isLight
                ? 'border-tf-dark/14 bg-white text-tf-dark shadow-sm hover:border-orange-300/60 hover:bg-orange-50/80'
                : 'border-white/18 bg-white/[0.1] text-white hover:bg-white/[0.16]',
            )}
          >
            <span aria-hidden>💬</span>
            Débats
          </Link>
          <Link
            to="/match"
            className={cn(
              'tf-interactive-press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-[11px] font-black leading-tight sm:min-h-10 sm:text-xs',
              isLight
                ? 'border-rose-300/45 bg-gradient-to-b from-rose-50/90 to-white text-rose-900 shadow-sm hover:border-rose-400/70'
                : 'border-rose-400/35 bg-rose-500/15 text-rose-50 hover:bg-rose-500/25',
            )}
          >
            <span aria-hidden>⚽</span>
            Live & agenda
          </Link>
          <Link
            to="/pronostic?vue=classement"
            className={cn(
              'tf-interactive-press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-[11px] font-black leading-tight sm:min-h-10 sm:text-xs',
              isLight
                ? 'border-tf-dark/14 bg-white text-tf-dark shadow-sm hover:border-tf-electric/30 hover:bg-tf-ice/60'
                : 'border-white/18 bg-white/[0.1] text-white hover:bg-white/[0.16]',
            )}
          >
            <span aria-hidden>🎯</span>
            Classement parieurs
          </Link>
        </div>
      </nav>
    </div>
  )
}
