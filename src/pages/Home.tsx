import { useMatches } from '../contexts/MatchesContext'
import { useArticles } from '../contexts/ArticlesContext'
import { useDebates } from '../contexts/DebatesContext'
import { AdSlot } from '../components/ui/AdSlot'
import { Link, useNavigate } from 'react-router-dom'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { TrendingDebatesSection } from '../components/home/TrendingDebatesSection'
import { useEffect, useMemo, useState } from 'react'
import { useLiveEncartSimulation } from '../hooks/useLiveEncartSimulation'
import { cn } from '../utils/cn'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { sortGroupsByFanAffinity, getGroupAccess } from '../utils/groupAccess'
import { filterNewsForFan } from '../utils/filterNews'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { FavoritesEncart } from '../components/fan/FavoritesEncart'
import { HomeDesktopExperience } from '../components/home/HomeDesktopExperience'
import { HomeFeedContinuation } from '../components/home/HomeFeedContinuation'
import { HomeMobileExperience } from '../components/mobile/HomeMobileExperience'
import { useAppearance } from '../contexts/AppearanceContext'
import { useIsMobileTouchViewport } from '../hooks/useIsMobileTouchViewport'
import { hubTrendsShell } from '../utils/hubSurface'
import { getSportMonksTokenSource } from '../utils/apiTokens'
import { HomeEditorialIntro } from '../components/ads/HomeEditorialIntro'
import { useOptionalSeasonMode } from '../contexts/SeasonModeContext'
import { CdmTodayMatches } from '../components/cdm/CdmTodayMatches'
import { CdmNationsRail } from '../components/cdm/CdmNationsRail'
import { FavoriteNationsHomeSection } from '../components/cdm/FavoriteNationsHomeSection'
import { SiteLegalFooter } from '../components/legal/SiteLegalFooter'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

export function HomePage() {
  const navigate = useNavigate()
  const { carouselMatches, matches, loading } = useMatches()
  const { groups, createGroup, isJoined } = useSupporterGroups()
  const { articles: publishedArticles, loading: articlesLoading } = useArticles()
  const { debates, debateOfTheDay, trendingDebates, loading: debatesLoading } = useDebates()
  const {
    favoriteLeagueId,
    favoriteClubIds,
    hideRivalSalons,
    setHideRivalSalons,
  } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()
  const { appearance } = useAppearance()
  const isMobileTouch = useIsMobileTouchViewport()
  const season = useOptionalSeasonMode()
  const isCdm = season?.isCdm2026 ?? false

  const accessPrefs = useMemo(
    () => ({
      favoriteClubIds,
      favoriteLeagueId,
      hideRivalSalons,
    }),
    [favoriteClubIds, favoriteLeagueId, hideRivalSalons],
  )

  const sortedGroups = useMemo(
    () => sortGroupsByFanAffinity(groups, accessPrefs),
    [groups, accessPrefs],
  )

  const visibleGroups = useMemo(
    () => sortedGroups.filter((g) => getGroupAccess(g, accessPrefs) !== 'hidden'),
    [sortedGroups, accessPrefs],
  )

  const myCreatedGroups = useMemo(
    () => groups.filter((g) => isJoined(g.id) || g.createdBy === 'me'),
    [groups, isJoined],
  )

  const activeGroupsRail = visibleGroups.slice(0, 2)

  /**
   * En mode CDM 2026, on remplace les flux matchs nationaux par les seuls matchs
   * Coupe du Monde (`competition.id === 'wc-2026'`). Pendant la fenêtre du Mondial,
   * les championnats sont en pause — on ne veut pas montrer un encart vide.
   */
  const displayMatches = useMemo(
    () => (isCdm ? carouselMatches.filter((m) => m.competition.id === 'wc-2026') : carouselMatches),
    [carouselMatches, isCdm],
  )
  const displayMatchesFull = useMemo(
    () => (isCdm ? matches.filter((m) => m.competition.id === 'wc-2026') : matches),
    [matches, isCdm],
  )

  /** Teinte supporter ≠ fil messages : seul le fil équipe de cœur (Profil) filtre chats / top com. */
  const personalizedNews = useMemo(
    () => filterNewsForFan(publishedArticles, favoriteLeagueId, favoriteClubIds),
    [publishedArticles, favoriteClubIds, favoriteLeagueId],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [heroSlide, setHeroSlide] = useState(0)

  /** Hub : tous les matchs en direct renvoyés par SportMonks (ordre du carrousel). */
  const hubLiveMatches = useMemo(
    () => displayMatches.filter((m) => m.status === 'live'),
    [displayMatches],
  )

  const hubLiveIds = hubLiveMatches.map((m) => m.id).join('|')
  useEffect(() => {
    // Réinitialiser l’index du hero quand le live mis en avant change.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset contrôlé du carousel multi-live
    setHeroSlide(0)
  }, [hubLiveIds])

  const heroLiveMatch = useMemo(() => hubLiveMatches[heroSlide] ?? null, [hubLiveMatches, heroSlide])
  const heroLiveSim = useLiveEncartSimulation(heroLiveMatch)

  const clubFocusLabel = useMemo(() => {
    if (favoriteClubIds.length === 0) return ''
    return favoriteClubIds
      .map((id) => ALL_CLUBS_BY_ID[id]?.shortName ?? id)
      .join(' · ')
  }, [favoriteClubIds])

  const supporterFocusUi = Boolean(supporterTintActive && team && favoriteClubIds.length > 0)

  /** Prochains matchs (même logique que le hub desktop) : encart d’accueil tant qu’il n’y a pas de live. */
  const upcomingSortedForHome = useMemo(() => {
    return [...displayMatchesFull]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
  }, [displayMatchesFull])

  /** Sous le live : 2 lignes compactes rail, sans scroll horizontal */
  const upcomingUnderLiveStrip = useMemo(() => upcomingSortedForHome.slice(0, 2), [upcomingSortedForHome])

  const trendsShell = hubTrendsShell(appearance)

  /**
   * Bloc CDM 2026 complémentaire : matchs du jour + rail nations.
   *
   * Le hero CDM est affiché DANS le hub central (à la place des live championnats
   * en mode CDM). Ici on ajoute juste le contenu enrichi autour.
   */
  const cdmTopBlockMobile = isCdm ? (
    <div className="space-y-4">
      <FavoriteNationsHomeSection />
      <CdmTodayMatches />
      <CdmNationsRail variant="tile" title="Sélections CDM" hint="Drapeau + fiche pays" />
    </div>
  ) : null

  const cdmTopBlockDesktop = isCdm ? (
    <div className="space-y-4">
      <FavoriteNationsHomeSection />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <CdmTodayMatches />
        <CdmNationsRail variant="tile" title="Sélections CDM" hint="Drapeau + fiche pays" />
      </div>
    </div>
  ) : null

  const wideHomeBelowFold = (
    <>
      {cdmTopBlockDesktop}
      <HomeEditorialIntro />
      <section className={cn('w-full', trendsShell)} aria-label="Débats tendances">
        <TrendingDebatesSection debates={trendingDebates} loading={debatesLoading} variant="band" />
      </section>
      {isCdm ? null : <FavoritesEncart className="w-full" />}
      <div className="w-full space-y-6 sm:space-y-8">
        <div className="tf-home-block rounded-[20px] p-3 sm:p-4 lg:rounded-2xl">
          <AdSlot
            compact
            tone="navy"
            brand="Matchday sponsor"
            body="Sous le hub — fil d’actualité et conversations."
            imageSeed="home-under-hero-desktop"
            contentReady={!loading}
          />
        </div>
        <HomeFeedContinuation
          idPrefix="d-"
          fullWidth
          displayMatches={displayMatches}
          heroLiveMatch={heroLiveMatch}
          heroLiveSim={heroLiveSim}
          personalizedNews={personalizedNews}
          articlesLoading={articlesLoading}
          supporterFocusUi={supporterFocusUi}
          clubFocusLabel={clubFocusLabel}
          team={team}
          contentReady={!loading}
        />
        <SiteLegalFooter className="rounded-t-2xl" />
      </div>
    </>
  )

  const smKeyBanner =
    getSportMonksTokenSource() === 'none' ? (
      <div className="mx-auto w-full max-w-[min(100%,112.5rem)] px-4 pt-2 lg:px-6">
        <Link
          to="/settings/donnees#tf-sportmonks-cle"
          className={cn(
            TF_FOCUS_VISIBLE,
            'flex w-full flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3 text-center shadow-sm transition',
            appearance === 'light'
              ? 'border-tf-electric/40 bg-sky-50 text-tf-dark hover:border-tf-electric/60 hover:shadow-md'
              : 'border-sky-400/35 bg-sky-950/40 text-sky-100 hover:border-sky-300/50 hover:shadow-md',
          )}
        >
          <span className="flex items-center gap-2 text-sm font-black">
            Ajouter la clé SportMonks (ce navigateur)
            <span aria-hidden>→</span>
          </span>
          {import.meta.env.PROD ? (
            <span className="max-w-xl text-[11px] font-semibold leading-snug opacity-90">
              Pour tous les visiteurs du site : variable <span className="font-mono">VITE_SPORTMONKS_TOKEN</span> sur
              Vercel + redeploy — voir Profil → Données.
            </span>
          ) : null}
        </Link>
      </div>
    ) : null

  return (
    <div
      className={cn(
        'w-full min-w-0 space-y-6 sm:space-y-8',
        !isMobileTouch && 'lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-0 lg:gap-0',
      )}
    >
      {smKeyBanner}
      {!isMobileTouch ? (
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[min(100%,112.5rem)] flex-1 flex-col gap-3 px-4 pb-0 lg:gap-3 xl:gap-4 xl:px-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <HomeDesktopExperience
            liveMatches={hubLiveMatches}
            upcomingMatches={displayMatchesFull}
            tribuneGroups={visibleGroups.slice(0, 4)}
            supporterGroupsPool={visibleGroups}
            myCreatedGroups={myCreatedGroups}
            allDebates={debates}
            trendingDebates={trendingDebates}
            debateOfTheDay={debateOfTheDay}
            debatesLoading={debatesLoading}
            matchesLoading={loading}
            onCreateTribune={() => setCreateOpen(true)}
            centerContinuation={wideHomeBelowFold}
          />
          </div>
        </div>
      ) : null}

      {isMobileTouch ? (
        <HomeMobileExperience
          appearance={appearance}
          isCdm={isCdm}
          loading={loading}
          heroLiveMatch={heroLiveMatch}
          heroLiveSim={heroLiveSim}
          hubLiveMatches={hubLiveMatches}
          heroSlide={heroSlide}
          setHeroSlide={setHeroSlide}
          upcomingSortedForHome={upcomingSortedForHome}
          upcomingUnderLiveStrip={upcomingUnderLiveStrip}
          displayMatchesFull={displayMatchesFull}
          displayMatches={displayMatches}
          debateOfTheDay={debateOfTheDay}
          debatesLoading={debatesLoading}
          trendingDebates={trendingDebates}
          activeGroupsRail={activeGroupsRail}
          personalizedNews={personalizedNews}
          articlesLoading={articlesLoading}
          supporterFocusUi={supporterFocusUi}
          clubFocusLabel={clubFocusLabel}
          team={team}
          hideRivalSalons={hideRivalSalons}
          setHideRivalSalons={setHideRivalSalons}
          onCreateGroup={() => setCreateOpen(true)}
          cdmTopBlockMobile={cdmTopBlockMobile}
        />
      ) : null}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (g) => {
          const r = await createGroup(g)
          if (!r.ok) return r
          navigate(`/group/${r.group.id}`)
          return { ok: true as const }
        }}
      />
    </div>
  )
}
