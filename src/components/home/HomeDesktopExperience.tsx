/**
 * Hub accueil large écran (tablette paysage, laptop — ≥md) : 3 colonnes cohérentes ;
 * le contenu sous le pli (tendances, favoris, fil) reste dans la colonne centrale.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel, hubPillLink } from '../../utils/hubSurface'
import type { Match } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import type { Debate } from '../../data/debates'
import { useLiveEncartSimulation } from '../../hooks/useLiveEncartSimulation'
import { cn } from '../../utils/cn'
import { HubStripUpcoming } from '../match/HubMatchEncart'
import { MatchSpotlightCard } from '../match/MatchSpotlightCard'
import { LiveMatchHero } from './LiveMatchHero'
import { HomeLandingHub } from './HomeLandingHub'
import { HomeMonEspacePanel } from './HomeMonEspacePanel'
import { DebateOfTheDayCard } from './DebateOfTheDayCard'
import { TribuneShowcaseCard } from '../tribune/TribuneShowcaseCard'
import { HomeSiteSearch, type HomeSiteSearchHandle } from '../search/HomeSiteSearch'
import { SearchTrends12h } from '../search/SearchTrends12h'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { CdmHomeReminder } from '../cdm/CdmHomeReminder'
import { FavoriteNationsHomeSection } from '../cdm/FavoriteNationsHomeSection'
import { FavoriteNationsAlertBar } from '../cdm/FavoriteNationsAlertBar'
import { useOptionalSeasonMode } from '../../contexts/SeasonModeContext'

function DesktopHubLiveStrip({
  match,
  fillColumnHeight,
  carousel,
}: {
  match: Match
  /** Une seule live + colonne « À venir » : aligner les hauteurs */
  fillColumnHeight?: boolean
  carousel?: { count: number; index: number; onSelect: (i: number) => void }
}) {
  const simulation = useLiveEncartSimulation(match)
  return (
    <LiveMatchHero
      match={match}
      simulation={simulation}
      variant="spotlight"
      fillColumnHeight={fillColumnHeight}
      carousel={carousel}
      className={cn(
        'w-full min-w-0 max-w-none',
        fillColumnHeight ? 'h-full min-h-0 self-stretch' : 'h-auto self-start',
      )}
    />
  )
}

export function HomeDesktopExperience({
  liveMatches,
  upcomingMatches,
  tribuneGroups,
  supporterGroupsPool,
  myCreatedGroups,
  trendingDebates,
  debateOfTheDay,
  debatesLoading = false,
  onCreateTribune,
  /** Suite de page dans la colonne centrale (tendances, favoris, fil…) */
  centerContinuation,
}: {
  liveMatches: Match[]
  upcomingMatches: Match[]
  tribuneGroups: SupporterGroup[]
  /** Toutes les tribunes visibles (hors rivaux masqués) — pour le rail sans doublon avec la grille tribunes */
  supporterGroupsPool: SupporterGroup[]
  /** Tribunes / groupes créés par l’utilisateur (stockage local) */
  myCreatedGroups: SupporterGroup[]
  trendingDebates: Debate[]
  debateOfTheDay: Debate | null
  debatesLoading?: boolean
  onCreateTribune: () => void
  centerContinuation?: ReactNode
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const card = hubGlassPanel(appearance)
  const railHeadBorder = L ? 'border-b border-tf-dark/10' : 'border-b border-white/10'
  const hubSectionCaps = L ? 'text-tf-dark/90' : 'text-sky-100'
  const hubSecondary = L ? 'text-tf-dark/72' : 'text-sky-200/95'
  const debateRow = L
    ? 'flex gap-3 rounded-xl border border-tf-dark/10 bg-white/85 p-2.5 transition hover:border-orange-400/40 hover:bg-white'
    : 'flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 transition hover:border-orange-400/30 hover:bg-white/[0.07]'
  const [deskLiveIndex, setDeskLiveIndex] = useState(0)

  const liveIdsKey = liveMatches.map((m) => m.id).join('|')
  useEffect(() => {
    setDeskLiveIndex(0)
  }, [liveIdsKey])

  const upcomingSorted = useMemo(() => {
    return [...upcomingMatches]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
  }, [upcomingMatches])

  const hasLive = liveMatches.length > 0
  const showUpcomingInHeader = !hasLive && upcomingSorted.length > 0
  const showMixedHeader = hasLive && upcomingSorted.length > 0
  /** Sous le live / encart « Prochains matchs » : 1 mise en avant + 2 bandeaux (comme le hero live + 2 à venir). */
  const headerUpcomingPrimary = upcomingSorted.slice(0, 3)
  const featuredLiveMatch = liveMatches[deskLiveIndex] ?? liveMatches[0]
  const topDebates = trendingDebates.slice(0, 4)
  const tribunes = tribuneGroups.slice(0, 4)

  const railSpotlightMax = 4
  const railSpotlightGroups = useMemo(() => {
    const centerIds = new Set(tribuneGroups.map((g) => g.id))
    const others = supporterGroupsPool.filter((g) => !centerIds.has(g.id)).slice(0, railSpotlightMax)
    if (others.length > 0) return others
    return tribuneGroups.slice(0, railSpotlightMax)
  }, [tribuneGroups, supporterGroupsPool])

  const centerScrollRef = useRef<HTMLDivElement>(null)
  const homeSearchRef = useRef<HomeSiteSearchHandle>(null)
  const cdmSeason = useOptionalSeasonMode()
  const isCdm = cdmSeason?.isCdm2026 ?? false
  const [centerScrollFadeBottom, setCenterScrollFadeBottom] = useState(true)

  const syncCenterScrollFade = useCallback(() => {
    const el = centerScrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const canScroll = scrollHeight > clientHeight + 1
    const atBottom = scrollTop + clientHeight >= scrollHeight - 12
    setCenterScrollFadeBottom(canScroll && !atBottom)
  }, [])

  useEffect(() => {
    syncCenterScrollFade()
    const el = centerScrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => syncCenterScrollFade())
    ro.observe(el)
    window.addEventListener('resize', syncCenterScrollFade)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', syncCenterScrollFade)
    }
  }, [syncCenterScrollFade, hasLive, showMixedHeader, centerContinuation, tribunes.length])

  return (
    <div
      className={cn(
        'grid min-h-0 h-full w-full min-w-0 flex-1 items-stretch gap-5 md:gap-6 lg:gap-7 2xl:gap-10',
        /* Une seule ligne dont la hauteur = celle du parent : sinon la ligne s’allonge avec le contenu du centre et le scroll interne ne marche pas */
        'md:grid-rows-[minmax(0,1fr)]',
        'md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,14.5rem)]',
        'lg:grid-cols-[minmax(0,11.25rem)_minmax(0,1fr)_minmax(0,16.5rem)]',
        'xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,18rem)]',
        'md:overflow-hidden',
        'md:rounded-[24px] md:border md:border-white/[0.07] md:bg-gradient-to-br md:from-white/[0.04] md:to-transparent md:p-4 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        'lg:rounded-[28px] lg:p-6',
        L && 'md:border-tf-dark/10 md:from-white/80 md:to-tf-ice/20 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
      )}
    >
      {/* ——— Colonne perso : hauteur = cellule grille, léger scroll si trop long ——— */}
      <HomeMonEspacePanel
        density="hubSlim"
        railScrollBody
        myCreatedGroups={myCreatedGroups}
        onCreateTribune={onCreateTribune}
        className="min-h-0 h-full max-h-full flex flex-col overflow-hidden p-0"
      />

      {/* ——— Centre : défilement + fondu bas (plus de « coupe » nette) ——— */}
      <div className="relative isolate min-h-0 h-full min-w-0">
        <div
          ref={centerScrollRef}
          onScroll={syncCenterScrollFade}
          className="min-h-0 h-full min-w-0 space-y-5 overflow-y-auto overflow-x-hidden overscroll-contain pb-8 pr-0.5 [scrollbar-gutter:stable] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:space-y-6"
        >
        <div
          className={cn(
            card,
            /* z-30 : le panneau de suggestions (sibling absolu) reste au-dessus de l’encart matchs suivant (même colonne scroll) */
            'relative z-30 p-3 sm:p-4',
          )}
        >
          <div className="flex min-w-0 flex-col gap-3">
            <HomeSiteSearch
              ref={homeSearchRef}
              className="min-w-0 w-full"
              inputId="home-desktop-search"
              variant="hub"
            />
            <SearchTrends12h
              className="w-full min-w-0"
              onSelect={(term) => homeSearchRef.current?.applyQuery(term)}
            />
          </div>
        </div>

        {isCdm ? <CdmHomeReminder /> : null}
        {isCdm ? <FavoriteNationsAlertBar /> : null}
        {isCdm ? <FavoriteNationsHomeSection /> : null}

        <section
          aria-labelledby="desk-matches-primary-heading"
          className={cn(
            card,
            'flex flex-col overflow-hidden pb-2.5 pt-0 sm:pb-3',
            'ring-1 ring-white/[0.04] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]',
            L && 'ring-tf-dark/[0.06] shadow-tf-elev-2',
          )}
        >
          <HubEncartTopAccent appearance={appearance} preset={hasLive ? 'live' : 'upcoming'} />
          <div className="space-y-3 px-4 pt-3 sm:space-y-4 sm:px-5 sm:pt-4">
          {hasLive ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2
                    id="desk-matches-primary-heading"
                    className="min-w-0 font-display text-xl font-black tracking-tight text-tf-app-fg sm:text-2xl"
                  >
                    Matchs en direct
                  </h2>
                  <span className="shrink-0 rounded-md bg-tf-cta px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                    LIVE
                  </span>
                </div>
                <Link to="/match" className={cn(hubPillLink(appearance, 'sm'), 'shrink-0')}>
                  Voir tout
                </Link>
              </div>
              {showMixedHeader ? (
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="min-w-0 w-full">
                    <DesktopHubLiveStrip
                      match={featuredLiveMatch}
                      carousel={
                        liveMatches.length > 1
                          ? {
                              count: liveMatches.length,
                              index: deskLiveIndex,
                              onSelect: setDeskLiveIndex,
                            }
                          : undefined
                      }
                    />
                  </div>
                  <aside
                    className={cn(
                      'w-full min-w-0 rounded-tf-xl border px-3 py-3 shadow-sm sm:px-4 sm:py-3.5',
                      L
                        ? 'border-tf-dark/12 bg-gradient-to-br from-sky-50/50 to-white/80'
                        : 'border-white/[0.09] bg-gradient-to-br from-white/[0.07] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
                    )}
                    aria-labelledby="desk-upcoming-secondary-heading"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3
                        id="desk-upcoming-secondary-heading"
                        className={cn(
                          'text-[9px] font-black uppercase tracking-[0.16em] opacity-90',
                          hubSectionCaps,
                        )}
                      >
                        À venir
                      </h3>
                      <Link to="/match" className={cn(hubPillLink(appearance, 'sm'), 'shrink-0')}>
                        Calendrier
                      </Link>
                    </div>
                    <ul
                      className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5"
                      role="list"
                    >
                      {headerUpcomingPrimary.slice(0, 2).map((m) => (
                        <li key={m.id} className="min-w-0">
                          <HubStripUpcoming match={m} visualSize="hubCard" className="w-full" />
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>
              ) : (
                <DesktopHubLiveStrip
                  match={featuredLiveMatch}
                  carousel={
                    liveMatches.length > 1
                      ? {
                          count: liveMatches.length,
                          index: deskLiveIndex,
                          onSelect: setDeskLiveIndex,
                        }
                      : undefined
                  }
                />
              )}
              {liveMatches.length > 2 ? (
                <p className={cn('text-[10px] font-bold', hubSecondary)}>
                  +{liveMatches.length - 2} autre{liveMatches.length - 2 > 1 ? 's' : ''} en direct —{' '}
                  <Link to="/match" className={cn(hubPillLink(appearance, 'xs'), 'align-middle')}>
                    tout voir
                  </Link>
                </p>
              ) : null}
            </div>
          ) : showUpcomingInHeader ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2
                  id="desk-matches-primary-heading"
                  className="min-w-0 font-display text-lg font-black text-tf-app-fg sm:text-xl"
                >
                  Prochains matchs
                </h2>
                <Link to="/match" className={cn(hubPillLink(appearance, 'sm'), 'shrink-0')}>
                  Voir tout
                </Link>
              </div>
              {headerUpcomingPrimary[0] ? (
                <MatchSpotlightCard
                  match={headerUpcomingPrimary[0]}
                  className="min-h-0 w-full min-w-0 max-w-3xl"
                />
              ) : null}
              {headerUpcomingPrimary.length > 1 ? (
                <div className="mx-auto grid w-full min-w-0 max-w-3xl auto-rows-auto grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-4">
                  {headerUpcomingPrimary.slice(1).map((m) => (
                    <HubStripUpcoming key={m.id} match={m} visualSize="hubCard" className="h-auto self-start" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-2 text-center sm:p-3">
              <h2 id="desk-matches-primary-heading" className="sr-only">
                Matchs
              </h2>
              <p className="text-sm font-semibold text-tf-app-fg">Aucun live pour l’instant.</p>
              <Link to="/match" className={cn(hubPillLink(appearance, 'md'), 'mt-2 inline-flex')}>
                Voir les matchs
              </Link>
            </div>
          )}
          </div>
        </section>

        <HomeLandingHub
          appearance={appearance}
          variant="contextRail"
          className={cn(card)}
          onCreateGroup={onCreateTribune}
        />

        <section aria-labelledby="desk-debate-day-heading" className="min-w-0">
          <h2 id="desk-debate-day-heading" className="sr-only">
            Débat du jour
          </h2>
          <DebateOfTheDayCard debate={debateOfTheDay} loading={debatesLoading} />
        </section>

        <section aria-labelledby="desk-tribunes-heading" className="min-w-0">
          <h2
            id="desk-tribunes-heading"
            className="font-display text-lg font-black leading-[1.15] tracking-tight text-tf-app-fg sm:text-xl lg:text-[1.35rem]"
          >
            En direct maintenant
          </h2>
          <p
            className={cn(
              'mt-2 max-w-[52ch] text-pretty text-sm font-semibold leading-relaxed sm:text-[0.9375rem]',
              hubSecondary,
            )}
          >
            Choisis ta tribune et rejoins la conversation.
          </p>
          <div className="mt-5 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 2xl:gap-5">
            {tribunes.map((g) => (
              <TribuneShowcaseCard key={g.id} group={g} variant="grid" className="min-h-0 min-w-0" />
            ))}
          </div>
        </section>

        {centerContinuation ? (
          <div
            className={cn(
              'space-y-8 border-t pt-8 md:space-y-10 md:pt-10',
              L ? 'border-tf-dark/10' : 'border-white/10',
            )}
          >
            {centerContinuation}
          </div>
        ) : null}

        </div>

        {/* Filtre bas : dégradé + léger voile — indique qu’il reste du contenu au scroll */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-20 bg-gradient-to-t to-transparent transition-opacity duration-500 ease-out sm:h-24 md:h-28',
            L
              ? 'from-[color:var(--tf-page-bg-light)] via-[color:var(--tf-ice)]/65'
              : 'from-[color:var(--tf-page-bg-dark)] via-[color:var(--tf-page-bg-dark)]/55',
            centerScrollFadeBottom ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16 bg-gradient-to-t from-transparent via-sky-500/[0.06] to-transparent mix-blend-overlay transition-opacity duration-500 sm:h-20',
            centerScrollFadeBottom ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-8 bottom-0 z-[4] h-px max-w-[min(100%,42rem)] translate-y-[-1px] bg-gradient-to-r from-transparent via-sky-400/35 to-transparent transition-opacity duration-500 md:inset-x-12',
            centerScrollFadeBottom ? 'opacity-100' : 'opacity-0',
            !L && 'via-sky-300/25',
          )}
          aria-hidden
        />
      </div>

      {/* ——— Rail droit ——— */}
      <aside className="flex min-h-0 h-full min-w-0 flex-col gap-3 overflow-hidden lg:gap-4">
        <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', card, 'p-0')}>
          <HubEncartTopAccent appearance={appearance} preset="tribune" />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-3.5">
            <div
              className={cn(
                'mb-3 flex min-w-0 shrink-0 flex-wrap items-end justify-between gap-2 pb-1.5',
                railHeadBorder,
              )}
            >
              <h3 className="line-clamp-2 min-w-0 flex-1 pr-2 font-display text-xs font-black uppercase leading-tight tracking-[0.18em] text-tf-app-fg">
                <span className="2xl:hidden">Tribunes</span>
                <span className="hidden 2xl:inline">Tribunes à découvrir</span>
              </h3>
              <Link
                to="/groups"
                className={cn(hubPillLink(appearance, 'xs'), 'shrink-0 max-w-[min(8.5rem,50%)] truncate xl:max-w-none')}
                title="Tous les groupes"
              >
                <span className="xl:hidden">Tous</span>
                <span className="hidden xl:inline">Tous les groupes</span>
              </Link>
            </div>
            <div
              className={cn(
                'min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 [scrollbar-gutter:stable] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              )}
            >
              <ul className="space-y-3 pb-0.5 pt-0.5" role="list">
                {railSpotlightGroups.length === 0 ? (
                  <li className={cn('text-xs font-semibold', hubSecondary)}>Aucun groupe pour l’instant.</li>
                ) : (
                  railSpotlightGroups.map((g, i) => (
                    <li
                      key={g.id}
                      className={cn(
                        'min-w-0',
                        i === 3 && 'hidden 2xl:block',
                      )}
                    >
                      <TribuneShowcaseCard group={g} variant="rail" dense />
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', card, 'p-0')}>
          <HubEncartTopAccent appearance={appearance} preset="debate" />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-3.5">
            <div
              className={cn('mb-0 shrink-0', railHeadBorder, 'pb-2.5')}
            >
              <h3 className="font-display text-xs font-black uppercase leading-snug tracking-[0.18em] text-tf-app-fg">
                Top débats
              </h3>
            </div>
            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 [scrollbar-gutter:stable] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                'pt-2.5',
              )}
            >
              <ol className="space-y-3 pb-1" role="list">
                {topDebates.map((d, i) => (
                  <li
                    key={d.id}
                    className="min-w-0"
                  >
                    <Link to={`/debate/${d.id}`} className={debateRow}>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-orange-500 to-rose-600 text-xs font-black text-white sm:size-8 sm:text-sm">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[11px] font-bold leading-snug text-tf-app-fg sm:text-xs">{d.title}</p>
                        <p className={cn('mt-0.5 flex min-w-0 items-center gap-1 text-[9px] font-bold sm:text-[10px]', hubSecondary)}>
                          <span aria-hidden>🔥</span>
                          {d.messagesCount.toLocaleString('fr-FR')} réponses
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <div
              className={cn(
                'relative z-[1] mt-2 shrink-0 border-t pt-2.5',
                L
                  ? 'border-tf-dark/10 bg-[color:color-mix(in_srgb,var(--tf-ice)_92%,white)]'
                  : 'border-white/10 bg-[color:var(--tf-card-bg-dark)]',
              )}
            >
              <Link
                to="/debates"
                className={cn(
                  hubPillLink(appearance, 'sm'),
                  'w-full justify-center text-center',
                  L
                    ? 'border-orange-200/90 bg-orange-50/95 text-orange-900 hover:border-orange-300 hover:bg-orange-50'
                    : 'border-orange-400/35 bg-orange-500/12 text-orange-100 hover:border-orange-400/50 hover:bg-orange-500/20',
                )}
              >
                Voir plus
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
