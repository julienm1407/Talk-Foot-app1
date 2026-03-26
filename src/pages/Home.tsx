import { useMatches } from '../contexts/MatchesContext'
import { mockNews } from '../data/news'
import { debateOfTheDay, trendingDebates } from '../data/debates'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { AdSlot } from '../components/ui/AdSlot'
import { Link } from 'react-router-dom'
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

export function HomePage() {
  const { carouselMatches, matches, loading } = useMatches()
  const { groups, createGroup } = useSupporterGroups()
  const {
    favoriteLeagueId,
    favoriteClubIds,
    hideRivalSalons,
    setHideRivalSalons,
  } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()
  const { appearance, setAppearance } = useAppearance()

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

  const activeGroupsRail = visibleGroups.slice(0, 4)

  const displayMatches = carouselMatches
  const displayMatchesFull = matches

  /** Le mode supporter (teinte maillot) ne restreint plus le fil : seul le Mode Virage filtre chats / top com. */
  const personalizedNews = useMemo(
    () => filterNewsForFan(mockNews, favoriteLeagueId, favoriteClubIds),
    [favoriteClubIds, favoriteLeagueId],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [feedTab, setFeedTab] = useState<'actu' | 'comments'>('comments')
  const [heroSlide, setHeroSlide] = useState(0)

  const liveMatches = useMemo(
    () => displayMatches.filter((m) => m.status === 'live'),
    [displayMatches],
  )

  const liveIds = liveMatches.map((m) => m.id).join('|')
  useEffect(() => {
    // Réinitialiser l’index du hero quand la liste des lives change (filtre / données).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset contrôlé du carousel multi-live
    setHeroSlide(0)
  }, [liveIds])

  const heroLiveMatch = useMemo(() => liveMatches[heroSlide] ?? null, [liveMatches, heroSlide])
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
      .slice(0, 8)
  }, [displayMatchesFull])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  const railDebates = trendingDebates.slice(0, 4)

  const trendsShell = hubTrendsShell(appearance)

  /** Maquette : 3 colonnes ; hero sur gauche+centre ; rail droit sur 2 rangées ; bas de page en pleine largeur utile. */
  const bentoCols =
    'lg:grid-cols-[minmax(0,200px)_minmax(300px,1fr)_minmax(0,248px)] xl:grid-cols-[minmax(0,212px)_minmax(320px,1fr)_minmax(0,260px)]'
  const bentoGrid = cn(
    'grid grid-cols-1 gap-4 sm:gap-5 lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-5',
    bentoCols,
  )
  const spanTwoCenter =
    'min-w-0 lg:col-span-2 lg:col-start-1 lg:row-start-1'

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8">
      {/* Hub desktop (≥xl) — maquette TalkFoot sombre 3 colonnes */}
      <div className="hidden xl:block xl:space-y-10">
        <HomeDesktopExperience
          liveMatches={liveMatches}
          upcomingMatches={displayMatchesFull}
          tribuneGroups={visibleGroups.slice(0, 4)}
          trendingDebates={trendingDebates}
          onCreateTribune={() => setCreateOpen(true)}
        />
        <section className={cn('mx-auto w-full max-w-[1200px]', trendsShell)} aria-label="Débats tendances">
          <TrendingDebatesSection debates={trendingDebates} variant="band" />
        </section>
        <FavoritesEncart className="mx-auto max-w-[1200px]" />
        <div className="mx-auto w-full max-w-[1200px] space-y-6 sm:space-y-8">
          <div className="tf-home-block rounded-[20px] p-3 sm:p-4 lg:rounded-2xl">
            <AdSlot
              compact
              tone="navy"
              brand="Matchday sponsor"
              body="Sous le hub desktop — débat du jour."
              imageSeed="home-under-hero-desktop"
            />
            <div className="mt-5 sm:mt-6">
              <DebateOfTheDayCard debate={debateOfTheDay} />
            </div>
          </div>
          <HomeFeedContinuation
            idPrefix="d-"
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
      </div>

      <div className="xl:hidden space-y-6 sm:space-y-8">
      <FavoritesEncart className="mx-auto max-w-[1200px]" />
      <header className={cn('mx-auto w-full max-w-[1200px] p-4 sm:p-5', hubGlassPanel(appearance))}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-black tracking-tight text-tf-app-fg sm:text-2xl">
              Bienvenue sur TalkFoot <span className="inline-block">💙</span>
            </h1>
            <p className="mt-1 max-w-xl text-xs font-semibold text-tf-app-muted sm:text-sm">
              Rejoins la communauté des passionnés et vis le football autrement.
            </p>
          </div>
          <div
            className={cn(
              'flex shrink-0 gap-1 rounded-xl p-1',
              appearance === 'light'
                ? 'border border-tf-dark/10 bg-tf-dark/[0.04]'
                : 'bg-white/[0.06]',
            )}
            role="group"
            aria-label="Thème d’affichage"
          >
            <button
              type="button"
              onClick={() => setAppearance('dark')}
              className={cn(
                'rounded-lg px-3 py-2 text-[11px] font-black transition',
                appearance === 'dark'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-tf-app-muted hover:bg-white/80 hover:text-tf-app-fg',
              )}
            >
              Nuit stade
            </button>
            <button
              type="button"
              onClick={() => setAppearance('light')}
              className={cn(
                'rounded-lg px-3 py-2 text-[11px] font-black transition',
                appearance === 'light'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-tf-app-muted hover:bg-white/10 hover:text-tf-app-fg',
              )}
            >
              Mode jour
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1200px] space-y-6 sm:space-y-8">
        {supporterTintActive && team ? (
          <div
            className="rounded-2xl border border-tf-electric/30 bg-tf-electric-soft/90 px-4 py-3 text-sm font-bold text-tf-dark shadow-sm"
            role="status"
          >
            Mode supporter actif : couleurs & titres autour de{' '}
            <span className="font-black">{clubFocusLabel || team.name}</span>. Les matchs et actus restent
            larges — pour filtrer les messages (live, salons, top com.), utilise le{' '}
            <strong className="font-black">Mode Virage</strong> dans Profil.
          </div>
        ) : null}

        {/* Bloc supérieur : même verre que le hub desktop */}
        <div className={cn('rounded-[20px] p-3 sm:p-4 lg:rounded-2xl', hubGlassPanel(appearance))}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:mb-5">
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link to="/matches" className="w-full sm:w-auto">
              <Button
                variant="soft"
                className="tf-interactive-press w-full rounded-2xl px-4 py-2.5 text-xs font-black sm:w-auto sm:py-2"
              >
                Hub matchs
              </Button>
            </Link>
            <Button
              variant="primary"
              className="tf-interactive-press w-full rounded-2xl px-4 py-2.5 text-xs font-black sm:w-auto sm:py-2"
              onClick={() => setCreateOpen(true)}
            >
              ➕ Créer un groupe
            </Button>
          </div>
          </div>

          {/* Bento type maquette : hero sur 2 colonnes, rail droit sur 2 rangées, matchs sous le hero à gauche */}
          <div className={cn(bentoGrid)}>
          <div className={cn('order-1', spanTwoCenter)}>
            {heroLiveMatch ? (
              <div className="space-y-4">
                <LiveMatchHero
                  match={heroLiveMatch}
                  simulation={heroLiveSim}
                  carousel={
                    liveMatches.length > 1
                      ? {
                          count: liveMatches.length,
                          index: heroSlide,
                          onSelect: setHeroSlide,
                        }
                      : undefined
                  }
                />
                {upcomingHeaderPool.length > 0 ? (
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5">
                      <h3 className="font-display text-sm font-black text-tf-app-fg sm:text-base">Prochains matchs</h3>
                      <Link
                        to="/matches"
                        className={cn(
                          'text-xs font-black hover:underline',
                          appearance === 'light' ? 'text-sky-700' : 'text-sky-300',
                        )}
                      >
                        Voir tout
                      </Link>
                    </div>
                    <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-tf-dark/15">
                      {upcomingHeaderPool.map((m) => (
                        <HubStripUpcoming key={m.id} match={m} className="min-w-[260px] max-w-[300px]" />
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
                <Link to="/matches" className="mt-4 inline-block text-sm font-black text-tf-electric-deep underline">
                  Voir les matchs
                </Link>
              </Card>
            )}
          </div>

          <aside className="order-5 flex justify-center lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:block lg:justify-start">
            <div className="w-full max-w-[360px] lg:max-w-none">
              <HomeRightColumn
                debates={railDebates}
                groups={activeGroupsRail}
                onCreateGroup={() => setCreateOpen(true)}
              />
            </div>
          </aside>

          <aside className="order-4 flex justify-center lg:order-none lg:col-start-1 lg:row-start-2 lg:block lg:justify-start">
            <div className="w-full max-w-[360px] lg:max-w-none">
              <HomeLeftColumn upcomingPool={displayMatchesFull} resultsPool={displayMatchesFull} />
            </div>
          </aside>

          <div className="order-2 flex min-w-0 flex-col gap-5 sm:gap-6 lg:order-none lg:col-start-2 lg:row-start-2">
            <AdSlot
              compact
              tone="navy"
              brand="Matchday sponsor"
              body="Sous le live, au-dessus du débat du jour."
              imageSeed="home-under-hero"
            />
            <DebateOfTheDayCard debate={debateOfTheDay} />
          </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-6">
          <AdSlot
            tone="blue"
            brand="Bannière milieu de page"
            body="Entre le bloc accueil (live & débat) et la bande tendances — format horizontal type leaderboard."
            imageSeed="home-hero-trends-gap"
          />
        </div>
      </div>

      <section className={cn('mx-auto w-full max-w-[1200px]', trendsShell)} aria-label="Débats tendances">
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
          createGroup(g)
        }}
      />
    </div>
  )
}
