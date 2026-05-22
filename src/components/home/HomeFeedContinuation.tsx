import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { NewsItem } from '../../data/news'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { MatchCarousel } from '../match/MatchCarousel'
import { NewsFeed } from './NewsFeed'
import { TopCommentsFeed } from './TopCommentsFeed'
import { BettorLeaderboard } from './BettorLeaderboard'
import { AdSlot } from '../ui/AdSlot'
import { SectionIntro } from '../ui/SectionIntro'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel } from '../../utils/hubSurface'
/** Infos club pour sous-titres (évite d’imposer tout le type Team depuis les hooks). */
export type HomeFeedTeamHint = { name: string; shortName: string } | null

function HomeResultPreviewCard({ match }: { match: Match }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const sc = match.score ?? { home: 0, away: 0 }
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
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <ClubCrest
            id={match.home.id}
            shortName={match.home.shortName}
            colors={match.home.colors}
            logoUrl={match.home.logoUrl}
            sportMonksTeamId={match.home.sportMonksTeamId}
            size={28}
          />
          <span className="truncate text-xs font-black text-tf-app-fg">{match.home.shortName}</span>
        </div>
        <p className="shrink-0 font-display text-lg font-black tabular-nums text-tf-app-fg sm:text-xl">
          {sc.home}
          <span className="mx-0.5 font-semibold opacity-40">–</span>
          {sc.away}
        </p>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <span className="truncate text-right text-xs font-black text-tf-app-fg">{match.away.shortName}</span>
          <ClubCrest
            id={match.away.id}
            shortName={match.away.shortName}
            colors={match.away.colors}
            logoUrl={match.away.logoUrl}
            sportMonksTeamId={match.away.sportMonksTeamId}
            size={28}
          />
        </div>
      </div>
      <span
        className={cn(
          'text-[11px] font-black transition',
          L ? 'text-sky-700 group-hover:text-sky-900' : 'text-sky-300/95 group-hover:text-white',
        )}
      >
        Salon →
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
  feedTab,
  setFeedTab,
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
  feedTab: 'actu' | 'comments'
  setFeedTab: (t: 'actu' | 'comments') => void
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
            className="flex flex-col overflow-visible border-2 border-sky-400/45 p-4 shadow-[0_12px_40px_rgba(14,165,233,0.12)] ring-1 ring-sky-300/30 sm:p-5"
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
                    : 'Live et prochains coups d’envoi — chaque carte ouvre le salon.'
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

        <div className="mt-5 sm:mt-6">
          <AdSlot
            tone="sky"
            brand="Partenaire carrousel"
            body="Entre le carrousel des matchs et le fil actus / top commentaires."
            imageSeed="home-carousel-feed"
            contentReady={contentReady}
          />
        </div>

        <section className="mt-6 min-w-0 lg:mt-8" aria-labelledby={pid('home-feed-heading')}>
          <Card className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6" elevation="soft">
            <SectionIntro
              section="home"
              titleId={pid('home-feed-heading')}
              eyebrow="FEED"
              title={
                supporterFocusUi && clubFocusLabel
                  ? `Actus ${clubFocusLabel} & communauté`
                  : 'Actus & communauté'
              }
              description={
                supporterFocusUi && team
                  ? `Fil compatible ${clubFocusLabel || team.shortName} et commentaires du kop.`
                  : 'Fil d’actus ou meilleurs commentaires des lives.'
              }
              actions={
                <Link to="/groups" className="w-full sm:w-auto">
                  <Button
                    variant="soft"
                    className="tf-interactive-press w-full rounded-2xl border-2 border-tf-dark/10 px-4 py-2.5 text-xs font-black uppercase tracking-wide sm:w-auto sm:py-2"
                  >
                    Toutes les tribunes
                  </Button>
                </Link>
              }
            />
            <div
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2"
              role="tablist"
              aria-label="Choisir le contenu du fil"
            >
              <button
                type="button"
                role="tab"
                aria-selected={feedTab === 'actu'}
                id={pid('home-feed-tab-actu')}
                aria-controls={pid('home-feed-panel')}
                onClick={() => setFeedTab('actu')}
                className={cn(
                  'tf-interactive-press min-h-11 rounded-2xl px-3 py-2.5 text-center text-xs font-black sm:min-h-0 sm:px-4 sm:text-sm',
                  feedTab === 'actu'
                    ? 'bg-tf-dark text-tf-white shadow-sm'
                    : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
                )}
              >
                Actu
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={feedTab === 'comments'}
                id={pid('home-feed-tab-comments')}
                aria-controls={pid('home-feed-panel')}
                onClick={() => setFeedTab('comments')}
                className={cn(
                  'tf-interactive-press min-h-11 rounded-2xl px-3 py-2.5 text-center text-xs font-black sm:min-h-0 sm:px-4 sm:text-sm',
                  feedTab === 'comments'
                    ? 'bg-tf-dark text-tf-white shadow-sm'
                    : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
                )}
              >
                <span className="hidden sm:inline">Top commentaires</span>
                <span className="leading-tight sm:hidden">Top com.</span>
              </button>
            </div>
            <div
              id={pid('home-feed-panel')}
              role="tabpanel"
              aria-labelledby={feedTab === 'actu' ? pid('home-feed-tab-actu') : pid('home-feed-tab-comments')}
              className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8"
            >
              <div className="min-w-0 flex-1">
                {feedTab === 'actu' ? (
                  <NewsFeed
                    embedded
                    items={personalizedNews}
                    loading={articlesLoading}
                    personalized
                    supporterClubShort={supporterFocusUi ? clubFocusLabel : null}
                  />
                ) : (
                  <TopCommentsFeed embedded />
                )}
              </div>
              <aside className="flex w-full shrink-0 flex-col gap-4 border-t border-tf-dark/10 pt-6 lg:w-72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:w-80">
                <BettorLeaderboard embedded />
                <AdSlot
                  tone="navy"
                  brand="BetMock"
                  body="Boost de cote — offre fictive pour visualiser une pub premium."
                  imageSeed="ad-bet"
                />
                <AdSlot
                  tone="blue"
                  brand="Sponsor: UltraWear"
                  body="Nouveau maillot 25/26 — placement publicitaire (mock)."
                  imageSeed="ad-wear"
                />
                <AdSlot
                  tone="sky"
                  brand="Streaming+"
                  body="Regarde le match en HD — emplacement pub (mock)."
                  imageSeed="ad-stream"
                />
              </aside>
            </div>
          </Card>
        </section>
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
            title={supporterFocusUi && clubFocusLabel ? `Salons — focus ${clubFocusLabel}` : 'Groupes et salons'}
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
            to="/rankings"
            className={cn(
              'tf-interactive-press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-[11px] font-black leading-tight sm:min-h-10 sm:text-xs',
              isLight
                ? 'border-tf-dark/14 bg-white text-tf-dark shadow-sm hover:border-tf-electric/30 hover:bg-tf-ice/60'
                : 'border-white/18 bg-white/[0.1] text-white hover:bg-white/[0.16]',
            )}
          >
            <span aria-hidden>🎯</span>
            Classement bets
          </Link>
        </div>
      </nav>
    </div>
  )
}
