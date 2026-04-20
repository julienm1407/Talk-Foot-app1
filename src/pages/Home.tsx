import { useMatches, REPLAY_LIVE_ID } from '../contexts/MatchesContext'
import { mockNews } from '../data/news'
import { debateOfTheDay, trendingDebates } from '../data/debates'
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
import { HomeUpcomingHero } from '../components/home/HomeUpcomingHero'
import { HubStripUpcoming } from '../components/match/HubMatchEncart'
import { useAppearance } from '../contexts/AppearanceContext'
import { hubGlassPanel, hubTrendsShell } from '../utils/hubSurface'
import { HomeLandingHub } from '../components/home/HomeLandingHub'
import { HubEncartTopAccent } from '../components/ui/HubEncartTopAccent'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { ThemeArrivalHint } from '../components/ui/ThemeArrivalHint'

export function HomePage() {
  const navigate = useNavigate()
  const { carouselMatches, matches, loading } = useMatches()
  const { groups, createGroup } = useSupporterGroups()
  const {
    favoriteLeagueId,
    favoriteClubIds,
    hideRivalSalons,
    setHideRivalSalons,
  } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()
  const { appearance } = useAppearance()

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

  const displayMatches = carouselMatches
  const displayMatchesFull = matches

  /** Teinte supporter ≠ fil messages : seul le fil équipe de cœur (Profil) filtre chats / top com. */
  const personalizedNews = useMemo(
    () => filterNewsForFan(mockNews, favoriteLeagueId, favoriteClubIds),
    [favoriteClubIds, favoriteLeagueId],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [feedTab, setFeedTab] = useState<'actu' | 'comments'>('comments')
  const [heroSlide, setHeroSlide] = useState(0)

  /** Hub (desktop + bento mobile) : seul le live replay principal PSG ; les autres lives restent sur /match */
  const hubLiveMatches = useMemo(
    () => displayMatches.filter((m) => m.status === 'live' && m.id === REPLAY_LIVE_ID),
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

  const upcomingHeaderPool = useMemo(() => {
    return [...displayMatchesFull]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 4)
  }, [displayMatchesFull])

  /** Sous le live : 2 lignes compactes rail, sans scroll horizontal */
  const upcomingUnderLiveStrip = useMemo(() => upcomingHeaderPool.slice(0, 2), [upcomingHeaderPool])

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

  const wideHomeBelowFold = (
    <>
      <section className={cn('w-full', trendsShell)} aria-label="Débats tendances">
        <TrendingDebatesSection debates={trendingDebates} variant="band" />
      </section>
      <FavoritesEncart className="w-full" />
      <div className="w-full space-y-6 sm:space-y-8">
        <div className="tf-home-block rounded-[20px] p-3 sm:p-4 lg:rounded-2xl">
          <AdSlot
            compact
            tone="navy"
            brand="Matchday sponsor"
            body="Sous le hub — fil d’actualité et conversations."
            imageSeed="home-under-hero-desktop"
          />
        </div>
        <HomeFeedContinuation
          idPrefix="d-"
          fullWidth
          displayMatches={displayMatches}
          heroLiveMatch={heroLiveMatch}
          heroLiveSim={heroLiveSim}
          personalizedNews={personalizedNews}
          feedTab={feedTab}
          setFeedTab={setFeedTab}
          supporterFocusUi={supporterFocusUi}
          clubFocusLabel={clubFocusLabel}
          team={team}
        />
      </div>
    </>
  )

  return (
    <div
      className={cn(
        'w-full min-w-0 space-y-6 sm:space-y-8',
        'md:flex md:h-full md:min-h-0 md:flex-1 md:flex-col md:space-y-0 md:gap-0',
      )}
    >
      {/*
        Vue ≥ md : une seule colonne logique « page » — bandeau thème + hub 3 colonnes + suite (tendances, favoris, fil)
        dans le même cadre visuel que le hub (continuation dans la colonne centrale).
      */}
      {/*
        Hauteur = viewport − header : le hub 3 colonnes remplit l’espace restant ; seule la colonne centrale défile.
      */}
      <div className="mx-auto hidden h-full min-h-0 w-full max-w-[min(100vw,1820px)] md:flex md:flex-1 md:flex-col md:gap-3 md:px-4 md:pb-0 lg:gap-4 lg:px-6">
        <ThemeArrivalHint className="w-full max-w-none shrink-0" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <HomeDesktopExperience
            liveMatches={hubLiveMatches}
            upcomingMatches={displayMatchesFull}
            tribuneGroups={visibleGroups.slice(0, 4)}
            supporterGroupsPool={visibleGroups}
            myCreatedGroups={myCreatedGroups}
            trendingDebates={trendingDebates}
            debateOfTheDay={debateOfTheDay}
            onCreateTribune={() => setCreateOpen(true)}
            centerContinuation={wideHomeBelowFold}
          />
        </div>
      </div>

      <div className="md:hidden space-y-6 sm:space-y-8">
      <ThemeArrivalHint className="mx-auto w-full max-w-tf-content" />
      <HomeLandingHub
        appearance={appearance}
        className={cn('mx-auto w-full max-w-tf-content', hubGlassPanel(appearance))}
        compact
        onCreateGroup={() => setCreateOpen(true)}
      />
      <FavoritesEncart className="mx-auto max-w-tf-content" />
      <div className="mx-auto w-full max-w-tf-content space-y-6 sm:space-y-8">
        {supporterTintActive && team ? (
          <div
            className="rounded-2xl border border-tf-electric/30 bg-tf-electric-soft/90 px-4 py-3 text-sm font-bold text-tf-dark shadow-sm"
            role="status"
          >
            Mode supporter actif : couleurs & titres autour de{' '}
            <span className="font-black">{clubFocusLabel || team.name}</span>. Les matchs et actus restent
            larges — pour filtrer les messages (live, salons, top com.), utilise le{' '}
            <strong className="font-black">{LIVE_FIL_EQUIPE_COEUR.label}</strong> dans Profil (pas les zones Virage /
            Chill du live, ni un salon groupe).
          </div>
        ) : null}

        {/* Bloc supérieur : même verre que le hub desktop */}
        <div className={cn('rounded-[20px] p-3 sm:p-4 lg:rounded-2xl', hubGlassPanel(appearance))}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <label
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-tf-grey-pastel/50 bg-tf-white/90 px-3 py-2.5 text-xs font-bold text-tf-dark shadow-sm sm:w-auto"
              title="Ex. masquer le salon OM si ton club de cœur est le PSG"
            >
              <input
                type="checkbox"
                checked={hideRivalSalons}
                onChange={(e) => setHideRivalSalons(e.target.checked)}
                className="size-4 rounded border-tf-grey-pastel"
              />
              <span className="leading-snug">Masquer salons rivaux</span>
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
            ) : upcomingHeaderPool.length > 0 ? (
              <HomeUpcomingHero matches={upcomingHeaderPool} />
            ) : (
              <Card className="border-dashed border-tf-grey-pastel/60 p-6 text-center sm:p-8" elevation="soft">
                <p className="text-sm font-bold text-tf-grey">
                  Aucun match en direct pour l’instant — vois les encarts matchs ou le carrousel ci-dessous.
                </p>
                <Link to="/match" className="mt-4 inline-block text-sm font-black text-tf-electric-deep underline">
                  Voir les matchs
                </Link>
              </Card>
            )}
            <div className="mt-5 space-y-4 sm:mt-6">
              <DebateOfTheDayCard debate={debateOfTheDay} />
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
            />
          </div>
          </div>
        </div>
      </div>

      <section className={cn('mx-auto w-full max-w-tf-content', trendsShell)} aria-label="Débats tendances">
        <TrendingDebatesSection debates={trendingDebates} variant="band" />
      </section>

      <HomeFeedContinuation
        idPrefix="m-"
        displayMatches={displayMatches}
        heroLiveMatch={heroLiveMatch}
        heroLiveSim={heroLiveSim}
        personalizedNews={personalizedNews}
        feedTab={feedTab}
        setFeedTab={setFeedTab}
        supporterFocusUi={supporterFocusUi}
        clubFocusLabel={clubFocusLabel}
        team={team}
      />
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(g) => {
          const created = createGroup(g)
          navigate(`/group/${created.id}`)
        }}
      />
    </div>
  )
}
