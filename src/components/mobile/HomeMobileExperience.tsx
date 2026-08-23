import { useMemo, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { NewsItem } from '../../data/news'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import type { Debate } from '../../data/debates'
import type { SupporterGroup } from '../../types/group'
import { cn } from '../../utils/cn'
import { hubGlassPanel, hubTrendsShell } from '../../utils/hubSurface'
import { LiveMatchHero } from '../home/LiveMatchHero'
import { HomeUpcomingHero } from '../home/HomeUpcomingHero'
import { DebateOfTheDayCard } from '../home/DebateOfTheDayCard'
import { HomeLeftColumn } from '../home/HomeLeftColumn'
import { HomeRightColumn } from '../home/HomeRightColumn'
import { TrendingDebatesSection } from '../home/TrendingDebatesSection'
import { HomeFeedContinuation } from '../home/HomeFeedContinuation'
import { HomeEditorialIntro } from '../ads/HomeEditorialIntro'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { HubStripFinished, HubStripUpcoming } from '../match/HubMatchEncart'
import { Card } from '../ui/Card'
import { CdmHomeHero } from '../cdm/CdmHomeHero'
import { CdmHomeReminder } from '../cdm/CdmHomeReminder'
import { FavoriteNationsAlertBar } from '../cdm/FavoriteNationsAlertBar'
import { FavoriteNationsHomeSection } from '../cdm/FavoriteNationsHomeSection'
import { CdmTodayMatches } from '../cdm/CdmTodayMatches'
import { CdmNationsRail } from '../cdm/CdmNationsRail'
import { FavoritesEncart } from '../fan/FavoritesEncart'
import { HomeSiteSearch, type HomeSiteSearchHandle } from '../search/HomeSiteSearch'
import { SearchTrends12h } from '../search/SearchTrends12h'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { MobileCollapsibleSection } from './MobileCollapsibleSection'
import { MobileQuickActionsBar } from './MobileQuickActionsBar'
import { HomeMobileMonEspaceStrip } from './HomeMobileMonEspaceStrip'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { TribuneShowcaseCard } from '../tribune/TribuneShowcaseCard'
import { resolveArticleExcerpt } from '../../utils/articleExcerpt'
import { newsItemHasArticlePage } from '../../data/news'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
import { CdmMobileSectionPreview } from '../cdm/CdmMobileSectionPreview'

export type HomeMobileExperienceProps = {
  appearance: 'light' | 'dark'
  isCdm: boolean
  loading: boolean
  heroLiveMatch: Match | null
  heroLiveSim: LiveEncartSimulation | null
  hubLiveMatches: Match[]
  heroSlide: number
  setHeroSlide: (i: number) => void
  upcomingSortedForHome: Match[]
  upcomingUnderLiveStrip: Match[]
  displayMatchesFull: Match[]
  displayMatches: Match[]
  debateOfTheDay: Debate | null
  debatesLoading: boolean
  trendingDebates: Debate[]
  activeGroupsRail: SupporterGroup[]
  personalizedNews: NewsItem[]
  articlesLoading: boolean
  supporterFocusUi: boolean
  clubFocusLabel: string
  team: { name: string; shortName: string } | null
  hideRivalSalons: boolean
  setHideRivalSalons: (v: boolean) => void
  onCreateGroup: () => void
  cdmTopBlockMobile: ReactNode
}

/**
 * Accueil mobile / tablette (< lg) — hiérarchie type app native :
 * hero → actions → débat → sections repliables.
 */
export function HomeMobileExperience({
  appearance,
  isCdm,
  loading,
  heroLiveMatch,
  heroLiveSim,
  hubLiveMatches,
  heroSlide,
  setHeroSlide,
  upcomingSortedForHome,
  upcomingUnderLiveStrip,
  displayMatchesFull,
  displayMatches,
  debateOfTheDay,
  debatesLoading,
  trendingDebates,
  activeGroupsRail,
  personalizedNews,
  articlesLoading,
  supporterFocusUi,
  clubFocusLabel,
  team,
  hideRivalSalons,
  setHideRivalSalons,
  onCreateGroup,
  cdmTopBlockMobile,
}: HomeMobileExperienceProps) {
  const L = appearance === 'light'
  const trendsShell = hubTrendsShell(appearance)
  const mobileSearchRef = useRef<HomeSiteSearchHandle>(null)
  const { favoriteClubIds } = useFanPreferences()

  const groupPreview = activeGroupsRail[0] ?? null

  const calendarPreviewMatch = useMemo(() => {
    const upcoming = [...displayMatchesFull]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    const finished = [...displayMatchesFull]
      .filter((m) => m.status === 'finished' && m.score)
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
    if (heroLiveMatch) return finished[0] ?? upcoming[0] ?? null
    return upcoming[0] ?? finished[0] ?? null
  }, [displayMatchesFull, heroLiveMatch])

  const favPreviewLabel = useMemo(() => {
    const id = favoriteClubIds[0]
    if (!id) return null
    return ALL_CLUBS_BY_ID[id]?.shortName ?? id
  }, [favoriteClubIds])

  const explorerPreviewArticle = personalizedNews[0] ?? null

  const matchPreview = (match: Match) =>
    match.status === 'upcoming' ? (
      <HubStripUpcoming match={match} visualSize="minimal" className="min-w-0" />
    ) : (
      <HubStripFinished match={match} className="min-w-0" />
    )

  const emptyPreview = (label: string) => (
    <p className="rounded-xl border border-dashed px-3 py-4 text-center text-xs font-semibold text-tf-app-muted">
      {label}
    </p>
  )

  const matchesLoadingShell = (
    <div
      className={cn(
        'space-y-2 rounded-2xl border p-4',
        L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/[0.04]',
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn('h-3 w-24 rounded-full animate-pulse', L ? 'bg-slate-200' : 'bg-white/15')} />
      <div className={cn('h-36 rounded-xl animate-pulse', L ? 'bg-slate-100' : 'bg-white/10')} />
      <p className="text-center text-[11px] font-semibold text-tf-app-muted">Chargement des matchs…</p>
    </div>
  )

  const heroBlock = loading ? (
    matchesLoadingShell
  ) : heroLiveMatch ? (
    <div className="space-y-2">
      <HubEncartTopAccent appearance={appearance} preset="live" />
      <LiveMatchHero
        match={heroLiveMatch}
        simulation={heroLiveSim!}
        carousel={
          hubLiveMatches.length > 1
            ? { count: hubLiveMatches.length, index: heroSlide, onSelect: setHeroSlide }
            : undefined
        }
      />
      {upcomingUnderLiveStrip.length > 0 ? (
        <div className={cn('min-w-0 border-t pt-2', L ? 'border-tf-dark/10' : 'border-white/10')}>
          <HubEncartTopAccent appearance={appearance} preset="upcoming" className="mb-2" />
          <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-tf-app-fg">À venir</h3>
            <Link to="/match" className={cn(TF_FOCUS_VISIBLE, 'text-[11px] font-black text-sky-400 hover:underline')}>
              Tout voir
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {upcomingUnderLiveStrip.map((m) => (
              <HubStripUpcoming key={m.id} match={m} visualSize="minimal" className="min-w-0" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  ) : upcomingSortedForHome.length > 0 ? (
    <HomeUpcomingHero matches={upcomingSortedForHome} />
  ) : isCdm ? (
    <CdmHomeHero />
  ) : (
    <Card className="border-dashed border-tf-grey-pastel/60 p-5 text-center" elevation="soft">
      <p className="text-sm font-bold text-tf-grey">Aucun match en direct pour l&apos;instant.</p>
      <Link to="/match" className={cn(TF_FOCUS_VISIBLE, 'mt-3 inline-block text-sm font-black text-tf-electric-deep underline')}>
        Voir le calendrier
      </Link>
    </Card>
  )

  return (
    <div className="tf-mobile-home mx-auto w-full max-w-tf-content space-y-4 pb-2 sm:space-y-5">
      <div
        className={cn(
          'sticky top-0 z-30 -mx-[var(--tf-page-gutter,0px)] border-b px-[var(--tf-page-gutter,0.75rem)] py-2.5 backdrop-blur-md sm:rounded-none',
          L
            ? 'border-tf-dark/10 bg-[#f3f7fb]/95'
            : 'border-white/10 bg-[#071422]/92',
        )}
      >
        <HomeSiteSearch
          ref={mobileSearchRef}
          inputId="home-mobile-search-v2"
          className="w-full [&_input]:min-h-tf-touch [&_input]:text-base"
        />
        <SearchTrends12h
          className="mt-2 w-full min-w-0"
          maxTerms={3}
          onSelect={(term) => mobileSearchRef.current?.applyQuery(term)}
        />
      </div>

      <HomeMobileMonEspaceStrip />

      {isCdm ? <CdmHomeReminder /> : null}
      {isCdm ? <FavoriteNationsAlertBar /> : null}

      {supporterFocusUi && team ? (
        <p
          role="status"
          className={cn(
            'rounded-xl px-3 py-2 text-[11px] font-semibold leading-snug',
            L ? 'bg-sky-50 text-tf-dark ring-1 ring-sky-200/80' : 'bg-sky-950/50 text-sky-100 ring-1 ring-sky-400/20',
          )}
        >
          Mode supporter · <strong className="font-black">{clubFocusLabel || team.name}</strong>
        </p>
      ) : null}

      <section aria-label="Match en direct" className={cn('rounded-[20px] p-3', hubGlassPanel(appearance))}>
        {heroBlock}
      </section>

      <MobileQuickActionsBar onCreateGroup={onCreateGroup} />

      <DebateOfTheDayCard debate={debateOfTheDay} loading={debatesLoading} />

      {isCdm ? (
        <MobileCollapsibleSection
          title="Coupe du Monde 2026"
          subtitle="Matchs du jour et sélections"
          badge="CDM"
          preview={<CdmMobileSectionPreview />}
        >
          {cdmTopBlockMobile ?? (
            <div className="space-y-3">
              <FavoriteNationsHomeSection />
              <CdmTodayMatches />
              <CdmNationsRail variant="tile" title="Sélections" hint="Fiches pays" />
            </div>
          )}
        </MobileCollapsibleSection>
      ) : null}

      <MobileCollapsibleSection
        title="Calendrier & résultats"
        subtitle="Prochains matchs et scores récents"
        preview={
          calendarPreviewMatch ? (
            matchPreview(calendarPreviewMatch)
          ) : (
            emptyPreview('Aucun match dans la fenêtre affichée.')
          )
        }
      >
        <HomeLeftColumn upcomingPool={displayMatchesFull} resultsPool={displayMatchesFull} omitUpcoming={Boolean(heroLiveMatch)} />
      </MobileCollapsibleSection>

      <MobileCollapsibleSection
        title="Tribunes & groupes"
        subtitle="Tes salons supporters"
        preview={
          groupPreview ? (
            <TribuneShowcaseCard group={groupPreview} variant="rail" dense />
          ) : (
            emptyPreview('Aucune tribune à afficher — crée la tienne ou rejoins un groupe.')
          )
        }
      >
        <label
          className={cn(
            'mb-3 flex min-h-tf-touch cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold',
            L ? 'border-tf-grey-pastel/50 bg-white/90 text-tf-dark' : 'border-white/12 bg-white/[0.04] text-white',
          )}
        >
          <input
            type="checkbox"
            checked={hideRivalSalons}
            onChange={(e) => setHideRivalSalons(e.target.checked)}
            className="size-4 rounded border-tf-grey-pastel"
          />
          Masquer tribunes rivales
        </label>
        <HomeRightColumn
          debates={[]}
          groups={activeGroupsRail}
          onCreateGroup={onCreateGroup}
          showDebatesSection={false}
        />
      </MobileCollapsibleSection>

      {!isCdm ? (
        <MobileCollapsibleSection
          title="Favoris"
          subtitle="Clubs et compétitions suivis"
          preview={
            favPreviewLabel ? (
              <Link
                to="/profile#favoris"
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'flex min-h-tf-touch items-center gap-3 rounded-xl border px-3 py-2.5',
                  L ? 'border-tf-dark/12 bg-white/90 text-tf-dark' : 'border-white/12 bg-white/[0.04] text-white',
                )}
              >
                <span className="text-xl" aria-hidden>
                  ⭐
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black">{favPreviewLabel}</span>
                  <span className="block text-[11px] font-semibold text-tf-app-muted">
                    {favoriteClubIds.length > 1
                      ? `+${favoriteClubIds.length - 1} club${favoriteClubIds.length > 2 ? 's' : ''} suivi${favoriteClubIds.length > 2 ? 's' : ''}`
                      : 'Club de cœur'}
                  </span>
                </span>
                <span className="text-xs font-black text-sky-400">→</span>
              </Link>
            ) : (
              emptyPreview('Ajoute des favoris dans ton profil.')
            )
          }
        >
          <FavoritesEncart />
        </MobileCollapsibleSection>
      ) : null}

      <MobileCollapsibleSection
        title="Explorer"
        subtitle="Actus et débats tendances"
        preview={
          explorerPreviewArticle && newsItemHasArticlePage(explorerPreviewArticle) ? (
            <Link
              to={`/article/${explorerPreviewArticle.slug}`}
              className={cn(
                TF_FOCUS_VISIBLE,
                'block rounded-xl border px-3 py-2.5 transition active:scale-[0.99]',
                L ? 'border-tf-dark/12 bg-white/90 hover:bg-tf-ice' : 'border-white/12 bg-white/[0.04] hover:bg-white/[0.07]',
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-wide text-sky-400">
                {explorerPreviewArticle.tag}
              </span>
              <p className="mt-1 line-clamp-2 text-sm font-black text-tf-app-fg">{explorerPreviewArticle.title}</p>
              {resolveArticleExcerpt(explorerPreviewArticle) ? (
                <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-tf-app-muted">
                  {resolveArticleExcerpt(explorerPreviewArticle)}
                </p>
              ) : null}
            </Link>
          ) : (
            emptyPreview('Les actus publiées apparaîtront ici.')
          )
        }
      >
        <div className="space-y-4">
          <HomeEditorialIntro />
          <section className={cn('w-full', trendsShell)} aria-label="Débats tendances">
            <TrendingDebatesSection debates={trendingDebates} loading={debatesLoading} variant="band" />
          </section>
          <HomeFeedContinuation
            idPrefix="m-"
            displayMatches={displayMatches}
            heroLiveMatch={heroLiveMatch}
            heroLiveSim={heroLiveSim!}
            personalizedNews={personalizedNews}
            articlesLoading={articlesLoading}
            supporterFocusUi={supporterFocusUi}
            clubFocusLabel={clubFocusLabel}
            team={team}
            contentReady={!loading}
          />
        </div>
      </MobileCollapsibleSection>
    </div>
  )
}
