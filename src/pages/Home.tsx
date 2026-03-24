import { useMatches } from '../contexts/MatchesContext'
import { mockNews } from '../data/news'
import { debateOfTheDay, trendingDebates } from '../data/debates'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MatchCarousel } from '../components/match/MatchCarousel'
import { NewsFeed } from '../components/home/NewsFeed'
import { TopCommentsFeed } from '../components/home/TopCommentsFeed'
import { BettorLeaderboard } from '../components/home/BettorLeaderboard'
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
import { SectionIntro } from '../components/ui/SectionIntro'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'
import {
  filterMatchesForSupporterClub,
  filterMatchesForSupporterClubs,
  filterNewsForSupporterClub,
  filterNewsForSupporterClubs,
} from '../utils/supporterMode'
import { mergeWithSyntheticIfSparse } from '../data/supporterSyntheticNews'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'

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

  const displayMatches = useMemo(() => {
    if (!supporterTintActive || favoriteClubIds.length === 0) return carouselMatches
    if (favoriteClubIds.length === 1) {
      return filterMatchesForSupporterClub(carouselMatches, favoriteClubIds[0])
    }
    return filterMatchesForSupporterClubs(carouselMatches, favoriteClubIds)
  }, [carouselMatches, supporterTintActive, favoriteClubIds])

  const displayMatchesFull = useMemo(() => {
    if (!supporterTintActive || favoriteClubIds.length === 0) return matches
    if (favoriteClubIds.length === 1) {
      return filterMatchesForSupporterClub(matches, favoriteClubIds[0])
    }
    return filterMatchesForSupporterClubs(matches, favoriteClubIds)
  }, [matches, supporterTintActive, favoriteClubIds])

  const personalizedNews = useMemo(() => {
    if (supporterTintActive && favoriteClubIds.length > 0 && favoriteLeagueId && team) {
      const strict =
        favoriteClubIds.length === 1
          ? filterNewsForSupporterClub(mockNews, favoriteLeagueId, favoriteClubIds[0])
          : filterNewsForSupporterClubs(mockNews, favoriteLeagueId, favoriteClubIds)
      return mergeWithSyntheticIfSparse(
        strict,
        3,
        favoriteClubIds[0],
        team.shortName,
        team.name,
        favoriteLeagueId,
      )
    }
    return filterNewsForFan(mockNews, favoriteLeagueId, favoriteClubIds)
  }, [supporterTintActive, favoriteClubIds, favoriteLeagueId, team])

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

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  const railDebates = trendingDebates.slice(0, 4)

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
      <div className="mx-auto w-full max-w-[1200px] space-y-6 sm:space-y-8">
        {supporterTintActive && team ? (
          <div
            className="rounded-2xl border border-tf-electric/30 bg-tf-electric-soft/90 px-4 py-3 text-sm font-bold text-tf-dark shadow-sm"
            role="status"
          >
            Mode supporter actif : accueil orienté{' '}
            <span className="font-black">{clubFocusLabel || team.name}</span> (matchs, actus, commentaires).
            Désactive la teinte maillot dans Profil → Apparence pour retrouver le fil général.
          </div>
        ) : null}

        {/* Bloc supérieur : hero, rails, débat du jour — se termine avant Tendances */}
        <div className="tf-home-block rounded-[20px] p-3 sm:p-4 lg:rounded-2xl">
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
            <DebateOfTheDayCard debate={debateOfTheDay} />
          </div>
          </div>
        </div>
      </div>

      {/* Encart Tendances : pleine largeur du panneau, délimite le haut de page et le reste */}
      <section
        className={cn(
          'relative -mx-4 w-[calc(100%+2rem)] border-y border-tf-dark/14',
          'bg-gradient-to-b from-tf-night/[0.09] via-tf-electric-soft/42 to-tf-ice/65',
          'py-7 shadow-[inset_0_3px_0_rgba(225,29,72,0.12),inset_0_1px_0_rgba(255,255,255,0.88)] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:py-9',
        )}
        aria-label="Débats tendances"
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <TrendingDebatesSection debates={trendingDebates} variant="band" />
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] space-y-6 sm:space-y-8">
        {/* Suite : carrousel + feed dans un cadre cohérent */}
        <div className="tf-home-block rounded-[20px] p-3 sm:p-4 lg:rounded-2xl">
          <section className="min-w-0" aria-labelledby="home-carousel-heading">
          <Card className="flex flex-col overflow-visible p-4 sm:p-5" elevation="soft">
            <MatchCarousel
              matches={displayMatches}
              eyebrow={supporterFocusUi && clubFocusLabel ? `FOCUS ${clubFocusLabel}` : 'LIVE & À VENIR'}
              title={supporterFocusUi && clubFocusLabel ? `À l’affiche — ${clubFocusLabel}` : 'À l’affiche'}
              titleId="home-carousel-heading"
              subtitle={
                supporterFocusUi && team
                  ? `Autres rencontres autour de ${clubFocusLabel || team.name}.`
                  : 'Matchs en direct et à venir — ouvre un salon pour suivre le live.'
              }
              liveMirror={
                heroLiveMatch ? { matchId: heroLiveMatch.id, ...heroLiveSim } : undefined
              }
            />
          </Card>
          </section>

          <section className="mt-6 min-w-0 lg:mt-8" aria-labelledby="home-feed-heading">
          <Card className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6" elevation="soft">
            <SectionIntro
              titleId="home-feed-heading"
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
                id="home-feed-tab-actu"
                aria-controls="home-feed-panel"
                onClick={() => setFeedTab('actu')}
                className={cn(
                  'min-h-11 rounded-2xl px-3 py-2.5 text-center text-xs font-black transition sm:min-h-0 sm:px-4 sm:text-sm',
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
                id="home-feed-tab-comments"
                aria-controls="home-feed-panel"
                onClick={() => setFeedTab('comments')}
                className={cn(
                  'min-h-11 rounded-2xl px-3 py-2.5 text-center text-xs font-black transition sm:min-h-0 sm:px-4 sm:text-sm',
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
              id="home-feed-panel"
              role="tabpanel"
              aria-labelledby={feedTab === 'actu' ? 'home-feed-tab-actu' : 'home-feed-tab-comments'}
              className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8"
            >
              <div className="min-w-0 flex-1">
                {feedTab === 'actu' ? (
                  <NewsFeed
                    embedded
                    items={personalizedNews}
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

        <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-tf-dark/12 bg-gradient-to-r from-tf-night/[0.06] via-tf-ice/70 to-tf-night/[0.04] px-3 py-3 pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <Badge tone="navy">💬 Général</Badge>
          <Badge tone="navy">🧾 Transferts{supporterFocusUi && clubFocusLabel ? ` ${clubFocusLabel}` : ''}</Badge>
          <Badge tone="live">🎯 Pronos{supporterFocusUi && clubFocusLabel ? ` ${clubFocusLabel}` : ''}</Badge>
          <Badge tone="navy">😂 Memes</Badge>
        </div>
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
