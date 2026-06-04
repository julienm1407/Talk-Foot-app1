import { useMatches } from '../contexts/MatchesContext'
import { useArticles } from '../contexts/ArticlesContext'
import { useDebates } from '../contexts/DebatesContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { AdSlot } from '../components/ui/AdSlot'
import { Link, useNavigate } from 'react-router-dom'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { LiveMatchHero } from '../components/home/LiveMatchHero'
import { HomeLeftColumn } from '../components/home/HomeLeftColumn'
import { HomeRightColumn } from '../components/home/HomeRightColumn'
import { DebateOfTheDayCard } from '../components/home/DebateOfTheDayCard'
import { TrendingDebatesSection } from '../components/home/TrendingDebatesSection'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { HomeUpcomingHero } from '../components/home/HomeUpcomingHero'
import { HubStripUpcoming } from '../components/match/HubMatchEncart'
import { useAppearance } from '../contexts/AppearanceContext'
import { hubGlassPanel, hubTrendsShell } from '../utils/hubSurface'
import { HomeLandingHub } from '../components/home/HomeLandingHub'
import { HubEncartTopAccent } from '../components/ui/HubEncartTopAccent'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { ThemeArrivalHint } from '../components/ui/ThemeArrivalHint'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import { getSportMonksTokenSource } from '../utils/apiTokens'
import { HomeSiteSearch, type HomeSiteSearchHandle } from '../components/search/HomeSiteSearch'
import { SearchTrends12h } from '../components/search/SearchTrends12h'
import { HomeEditorialIntro } from '../components/ads/HomeEditorialIntro'
import { useOptionalSeasonMode } from '../contexts/SeasonModeContext'
import { CdmHomeHero } from '../components/cdm/CdmHomeHero'
import { CdmTodayMatches } from '../components/cdm/CdmTodayMatches'
import { CdmNationsRail } from '../components/cdm/CdmNationsRail'
import { CdmHomeReminder } from '../components/cdm/CdmHomeReminder'
import { FavoriteNationsHomeSection } from '../components/cdm/FavoriteNationsHomeSection'
import { FavoriteNationsAlertBar } from '../components/cdm/FavoriteNationsAlertBar'
import { SiteLegalFooter } from '../components/legal/SiteLegalFooter'
import { DailyTokenBonusCard } from '../components/wallet/DailyTokenBonusCard'

export function HomePage() {
  const navigate = useNavigate()
  const { carouselMatches, matches, loading } = useMatches()
  const { groups, createGroup } = useSupporterGroups()
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

  const myCreatedGroups = useMemo(() => groups.filter((g) => g.createdBy === 'me'), [groups])

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
  const mobileSearchRef = useRef<HomeSiteSearchHandle>(null)

  const supporterFocusUi = Boolean(supporterTintActive && team && favoriteClubIds.length > 0)

  /** Prochains matchs (même logique que le hub desktop) : encart d’accueil tant qu’il n’y a pas de live. */
  const upcomingSortedForHome = useMemo(() => {
    return [...displayMatchesFull]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
  }, [displayMatchesFull])

  /** Sous le live : 2 lignes compactes rail, sans scroll horizontal */
  const upcomingUnderLiveStrip = useMemo(() => upcomingSortedForHome.slice(0, 2), [upcomingSortedForHome])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  const trendsShell = hubTrendsShell(appearance)

  /** Bento « téléphone » : sous md, une colonne ; md+ utilise le hub large écran. */
  const bentoCols =
    'md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,14rem)] lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,15rem)] xl:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)_minmax(0,17rem)]'
  const bentoGrid = cn(
    'grid grid-cols-1 gap-4 sm:gap-5 md:grid-rows-[auto_auto] md:items-start md:gap-x-5',
    bentoCols,
  )
  const spanTwoCenter = 'min-w-0 md:col-span-2 md:col-start-1 md:row-start-1'

  /**
   * Bloc CDM 2026 complémentaire : matchs du jour + rail nations.
   *
   * Le hero CDM est affiché DANS le hub central (à la place des live championnats
   * en mode CDM). Ici on ajoute juste le contenu enrichi autour.
   */
  const cdmTopBlockMobile = isCdm ? (
    <div className="mx-auto w-full max-w-tf-content space-y-4">
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
        'md:flex md:h-full md:min-h-0 md:flex-1 md:flex-col md:space-y-0 md:gap-0',
      )}
    >
      {smKeyBanner}
      {/*
        Vue ≥ md : une seule colonne logique « page » — bandeau thème + hub 3 colonnes + suite (tendances, favoris, fil)
        dans le même cadre visuel que le hub (continuation dans la colonne centrale).
      */}
      {/*
        Hauteur = viewport − header : le hub 3 colonnes remplit l’espace restant ; seule la colonne centrale défile.
      */}
      <div className="mx-auto hidden h-full min-h-0 w-full max-w-[min(100%,112.5rem)] md:flex md:flex-1 md:flex-col md:gap-3 md:px-4 md:pb-0 lg:gap-4 lg:px-6">
        <ThemeArrivalHint className="w-full max-w-none shrink-0" />
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
            onCreateTribune={() => setCreateOpen(true)}
            centerContinuation={wideHomeBelowFold}
          />
        </div>
      </div>

      <div className="md:hidden space-y-6 sm:space-y-8">
      <ThemeArrivalHint className="mx-auto w-full max-w-tf-content" />
      <div className="mx-auto w-full max-w-tf-content px-3 sm:px-4">
        <DailyTokenBonusCard variant="prominent" />
      </div>
      {cdmTopBlockMobile ? (
        <div className="mx-auto w-full max-w-tf-content px-3 sm:px-4">
          {cdmTopBlockMobile}
        </div>
      ) : null}
      <section
        className={cn(
          'mx-auto w-full max-w-tf-content rounded-2xl border p-2.5',
          appearance === 'light'
            ? 'border-tf-electric/20 bg-white/95 shadow-sm'
            : 'border-sky-400/20 bg-[#0a1e36]/95 ring-1 ring-sky-400/10',
        )}
        aria-label="Recherche rapide"
      >
        <p
          className={cn(
            'mb-1 text-[10px] font-black uppercase tracking-[0.16em]',
            appearance === 'light' ? 'text-tf-electric-deep' : 'text-sky-200/90',
          )}
        >
          Rechercher
        </p>
        <HomeSiteSearch
          ref={mobileSearchRef}
          inputId="home-mobile-search"
          className="w-full [&_input]:min-h-[2.35rem] [&_input]:text-sm"
        />
        <SearchTrends12h
          className="mt-1.5 w-full min-w-0"
          maxTerms={2}
          onSelect={(term) => mobileSearchRef.current?.applyQuery(term)}
        />
      </section>
      {isCdm ? (
        <CdmHomeReminder className="mx-auto w-full max-w-tf-content" />
      ) : null}
      {isCdm ? (
        <FavoriteNationsAlertBar className="mx-auto w-full max-w-tf-content" />
      ) : null}
      <HomeLandingHub
        appearance={appearance}
        className={cn('mx-auto w-full max-w-tf-content', hubGlassPanel(appearance))}
        compact
        onCreateGroup={() => setCreateOpen(true)}
      />
      {isCdm ? null : <FavoritesEncart className="mx-auto max-w-tf-content" />}
      <HomeEditorialIntro />
      <div className="mx-auto w-full max-w-tf-content space-y-6 sm:space-y-8">
        {supporterTintActive && team ? (
          <div
            className="rounded-2xl border border-tf-electric/30 bg-tf-electric-soft/90 px-4 py-3 text-sm font-bold text-tf-dark shadow-sm"
            role="status"
          >
            Mode supporter actif : couleurs & titres autour de{' '}
            <span className="font-black">{clubFocusLabel || team.name}</span>. Les matchs et actus restent
            larges — pour filtrer les messages (live, tribunes, top com.), utilise le{' '}
            <strong className="font-black">{LIVE_FIL_EQUIPE_COEUR.label}</strong> dans Profil (pas les zones Virage /
            Chill du live, ni une tribune groupe).
          </div>
        ) : null}

        {/* Bloc supérieur : même verre que le hub desktop */}
        <div
          className={cn(
            'min-w-0 max-w-full overflow-x-clip rounded-[20px] p-3 sm:p-4 lg:rounded-2xl',
            hubGlassPanel(appearance),
          )}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <label
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-tf-grey-pastel/50 bg-tf-white/90 px-3 py-2.5 text-xs font-bold text-tf-dark shadow-sm sm:w-auto"
              title="Ex. masquer la tribune OM si ton club de cœur est le PSG"
            >
              <input
                type="checkbox"
                checked={hideRivalSalons}
                onChange={(e) => setHideRivalSalons(e.target.checked)}
                className="size-4 rounded border-tf-grey-pastel"
              />
              <span className="leading-snug">Masquer tribunes rivales</span>
            </label>
            <Button
              variant="primary"
              className="tf-interactive-press w-full rounded-2xl px-4 py-2.5 text-xs font-black sm:w-auto sm:py-2"
              onClick={() => setCreateOpen(true)}
            >
              ➕ Créer un groupe
            </Button>
          </div>

          {/* Bento type maquette : hero sur 2 colonnes, rail droit sur 2 rangées, matchs sous le hero à gauche */}
          <div className={cn(bentoGrid)}>
          <div className={cn('order-1', spanTwoCenter)}>
            {heroLiveMatch ? (
              <div className="space-y-2">
                <HubEncartTopAccent appearance={appearance} preset="live" />
                <LiveMatchHero
                  match={heroLiveMatch}
                  simulation={heroLiveSim}
                  carousel={
                    hubLiveMatches.length > 1
                      ? {
                          count: hubLiveMatches.length,
                          index: heroSlide,
                          onSelect: setHeroSlide,
                        }
                      : undefined
                  }
                />
                {upcomingUnderLiveStrip.length > 0 ? (
                  <div className="min-w-0 border-t border-tf-dark/10 pt-2 dark:border-white/10">
                    <HubEncartTopAccent appearance={appearance} preset="upcoming" className="mb-2" />
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 px-0.5">
                      <h3
                        className={cn(
                          'text-[10px] font-black uppercase tracking-wider',
                          appearance === 'light' ? 'text-tf-dark/90' : 'text-sky-100',
                        )}
                      >
                        À venir
                      </h3>
                      <Link
                        to="/match"
                        className={cn(
                          'text-[10px] font-black hover:underline',
                          appearance === 'light' ? 'text-tf-dark' : 'text-sky-300',
                        )}
                      >
                        Voir tout
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
              <Card className="border-dashed border-tf-grey-pastel/60 p-6 text-center sm:p-8" elevation="soft">
                <p className="text-sm font-bold text-tf-grey">
                  Aucun match à venir dans la fenêtre — ouvre le calendrier ou le carrousel ci-dessous.
                </p>
                <Link to="/match" className="mt-4 inline-block text-sm font-black text-tf-electric-deep underline">
                  Voir les matchs
                </Link>
              </Card>
            )}
            <div className="mt-5 space-y-4 sm:mt-6">
              <DebateOfTheDayCard debate={debateOfTheDay} loading={debatesLoading} />
            </div>
          </div>

          <aside className="order-5 flex justify-center md:order-none md:col-start-3 md:row-start-1 md:row-span-2 md:block md:justify-start">
            <div className="w-full max-w-tf-hub-rail min-w-0 md:max-w-none">
              <HomeRightColumn
                debates={[]}
                groups={activeGroupsRail}
                onCreateGroup={() => setCreateOpen(true)}
                showDebatesSection={false}
              />
            </div>
          </aside>

          <aside className="order-4 flex justify-center md:order-none md:col-start-1 md:row-start-2 md:block md:justify-start">
            <div className="w-full max-w-tf-hub-rail min-w-0 md:max-w-none">
              <HomeLeftColumn
                upcomingPool={displayMatchesFull}
                resultsPool={displayMatchesFull}
                omitUpcoming
              />
            </div>
          </aside>

          <div className="order-2 flex min-w-0 flex-col gap-5 sm:gap-6 md:order-none md:col-start-2 md:row-start-2">
            <AdSlot
              compact
              tone="navy"
              brand="Matchday sponsor"
              body="Sous le débat du jour dans la colonne principale."
              imageSeed="home-under-hero"
              contentReady={!loading}
            />
          </div>
          </div>
        </div>
      </div>

      <section className={cn('mx-auto w-full max-w-tf-content', trendsShell)} aria-label="Débats tendances">
        <TrendingDebatesSection debates={trendingDebates} loading={debatesLoading} variant="band" />
      </section>

      <HomeFeedContinuation
        idPrefix="m-"
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
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(g) => {
          const r = createGroup(g)
          if (!r.ok) return r
          navigate(`/group/${r.group.id}`)
          return { ok: true as const }
        }}
      />
    </div>
  )
}
