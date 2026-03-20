import { useMatches } from '../contexts/MatchesContext'
import { mockNews } from '../data/news'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MatchCarousel } from '../components/match/MatchCarousel'
import { MatchQuickAccess } from '../components/home/MatchQuickAccess'
import { NewsFeed } from '../components/home/NewsFeed'
import { TopCommentsFeed } from '../components/home/TopCommentsFeed'
import { BettorLeaderboard } from '../components/home/BettorLeaderboard'
import { AdSlot } from '../components/ui/AdSlot'
import { Link } from 'react-router-dom'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { GroupCard } from '../components/group/GroupCard'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { QuickCreateGroupForm } from '../components/group/QuickCreateGroupForm'
import { useMemo, useState } from 'react'
import { cn } from '../utils/cn'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { sortGroupsByFanAffinity, getGroupAccess } from '../utils/groupAccess'
import { filterNewsForFan } from '../utils/filterNews'
import { SectionIntro } from '../components/ui/SectionIntro'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'
import { filterMatchesForSupporterClub, filterNewsForSupporterClub } from '../utils/supporterMode'
import { mergeWithSyntheticIfSparse } from '../data/supporterSyntheticNews'

export function HomePage() {
  const { carouselMatches, loading } = useMatches()
  const { groups, createGroup } = useSupporterGroups()
  const {
    favoriteLeagueId,
    favoriteClubId,
    hideRivalSalons,
    setHideRivalSalons,
  } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()

  const accessPrefs = useMemo(
    () => ({
      favoriteClubId,
      favoriteLeagueId,
      hideRivalSalons,
    }),
    [favoriteClubId, favoriteLeagueId, hideRivalSalons],
  )

  const sortedGroups = useMemo(
    () => sortGroupsByFanAffinity(groups, accessPrefs),
    [groups, accessPrefs],
  )

  const visibleGroups = useMemo(
    () => sortedGroups.filter((g) => getGroupAccess(g, accessPrefs) !== 'hidden'),
    [sortedGroups, accessPrefs],
  )

  const topGroups = visibleGroups.slice(0, 8)

  const displayMatches = useMemo(() => {
    if (supporterTintActive && favoriteClubId) {
      return filterMatchesForSupporterClub(carouselMatches, favoriteClubId)
    }
    return carouselMatches
  }, [carouselMatches, supporterTintActive, favoriteClubId])

  const personalizedNews = useMemo(() => {
    if (
      supporterTintActive &&
      favoriteClubId &&
      favoriteLeagueId &&
      team
    ) {
      const strict = filterNewsForSupporterClub(mockNews, favoriteLeagueId, favoriteClubId)
      return mergeWithSyntheticIfSparse(
        strict,
        3,
        favoriteClubId,
        team.shortName,
        team.name,
        favoriteLeagueId,
      )
    }
    return filterNewsForFan(mockNews, favoriteLeagueId, favoriteClubId)
  }, [
    supporterTintActive,
    favoriteClubId,
    favoriteLeagueId,
    team,
  ])
  const [createOpen, setCreateOpen] = useState(false)
  const [feedTab, setFeedTab] = useState<'actu' | 'comments'>('comments')

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  const clubShort = team?.shortName ?? ''
  /** Titres / copy « 100 % club » (évite libellés vides si données club incohérentes) */
  const supporterFocusUi = Boolean(supporterTintActive && team && favoriteClubId)

  return (
    <div className="space-y-8">
      {supporterTintActive && team ? (
        <div
          className="rounded-2xl border border-tf-electric/30 bg-tf-electric-soft/90 px-4 py-3 text-sm font-bold text-tf-dark shadow-sm"
          role="status"
        >
          Mode supporter actif : accueil orienté{' '}
          <span className="font-black">{team.name}</span> (matchs, actus, commentaires). Désactive la
          teinte maillot dans Profil → Apparence pour retrouver le fil général.
        </div>
      ) : null}

      <section aria-labelledby="home-matches-heading">
        <Card className="overflow-visible p-4 sm:p-5" elevation="soft">
          <div className="grid gap-3 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] lg:items-start">
            <aside
              className="min-w-0 max-h-[280px] overflow-y-auto sm:max-h-[320px] lg:max-h-[300px]"
              aria-label="Accès rapide aux matchs"
            >
              <MatchQuickAccess
                matches={carouselMatches}
                clubFocusId={supporterTintActive ? favoriteClubId : null}
              />
            </aside>
            <div className="min-w-0">
              <MatchCarousel
                matches={displayMatches}
                eyebrow={supporterFocusUi && clubShort ? `FOCUS ${clubShort}` : 'LIVE & À VENIR'}
                title={supporterFocusUi && clubShort ? `Matchs ${clubShort}` : 'Matchs'}
                titleId="home-matches-heading"
                subtitle={
                  supporterFocusUi && team
                    ? `On met en avant les matchs de ${team.name} ; si aucun n’est au programme, tout le calendrier reste visible.`
                    : 'En direct ou à l’affiche — ouvre un salon pour suivre le live.'
                }
              />
            </div>
          </div>
        </Card>
      </section>

      <section id="trending" className="space-y-4" aria-labelledby="home-groups-heading">
        <Card className="p-5 sm:p-6" elevation="soft">
          <SectionIntro
            titleId="home-groups-heading"
            eyebrow="COMMUNAUTÉ"
            title={supporterFocusUi && clubShort ? `Tribune ${clubShort}` : 'Tes groupes'}
            description={
              supporterFocusUi && team
                ? `Salons où ${team.shortName} est au centre — tes réglages rivaux restent valables.`
                : 'Salons par club ou ligue. Tu peux masquer les rivaux.'
            }
            actions={
              <Button
                variant="primary"
                className="rounded-3xl px-4 sm:px-5"
                onClick={() => setCreateOpen(true)}
                aria-label="Créer un nouveau groupe de supporters"
              >
                <span className="sm:hidden">+ Groupe</span>
                <span className="hidden sm:inline">Nouveau groupe</span>
              </Button>
            }
          />

          <div className="mt-2 grid gap-4 md:grid-cols-[1fr_minmax(260px,320px)]">
            <div className="space-y-2">
              <label
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-tf-grey-pastel/50 bg-tf-white/80 px-3 py-2 text-xs font-bold text-tf-dark"
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
              {topGroups.map((g) => (
                <Link
                  key={g.id}
                  to={`/group/${g.id}`}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  aria-label={`Ouvrir le groupe ${g.name}`}
                >
                  <GroupCard
                    group={g}
                    accessLevel={getGroupAccess(g, accessPrefs)}
                  />
                </Link>
              ))}
            </div>

            <div className="flex flex-col rounded-2xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/10 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-tight text-tf-dark">Création rapide</h3>
                <Button
                  variant="soft"
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs"
                  onClick={() => setCreateOpen(true)}
                  aria-label="Ouvrir la création avancée de groupe"
                >
                  Plus d’options
                </Button>
              </div>
              <div className="mt-3">
                <QuickCreateGroupForm onCreate={createGroup} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge>💬 Général</Badge>
                <Badge>
                  🧾 Transferts{supporterFocusUi && clubShort ? ` ${clubShort}` : ''}
                </Badge>
                <Badge>
                  🎯 Pronos{supporterFocusUi && clubShort ? ` ${clubShort}` : ''}
                </Badge>
                <Badge>😂 Memes</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link to="/calendar">
                  <Button variant="primary" className="rounded-3xl px-5">
                    Agenda
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="home-feed-heading">
        <Card className="p-5 sm:p-6" elevation="soft">
          <SectionIntro
            titleId="home-feed-heading"
            eyebrow="FEED"
            title={
              supporterFocusUi && clubShort
                ? `Actus ${clubShort} & communauté`
                : 'Actus & communauté'
            }
            description={
              supporterFocusUi && team
                ? `Fil 100 % compatible ${team.shortName} (actus) et commentaires du kop.`
                : 'Fil d’actus ou meilleurs commentaires des lives.'
            }
          />
          <div
            className="mb-5 flex flex-wrap gap-2 border-b border-tf-grey-pastel/40 pb-4"
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
                'rounded-2xl px-4 py-2.5 text-sm font-black transition',
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
                'rounded-2xl px-4 py-2.5 text-sm font-black transition',
                feedTab === 'comments'
                  ? 'bg-tf-dark text-tf-white shadow-sm'
                  : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
              )}
            >
              <span className="hidden sm:inline">Top commentaires</span>
              <span className="sm:hidden">Likés</span>
            </button>
          </div>
          <div
            id="home-feed-panel"
            role="tabpanel"
            aria-labelledby={feedTab === 'actu' ? 'home-feed-tab-actu' : 'home-feed-tab-comments'}
            className="grid gap-5 md:grid-cols-[1fr_minmax(280px,360px)]"
          >
            {feedTab === 'actu' ? (
              <NewsFeed
                items={personalizedNews}
                personalized
                supporterClubShort={supporterFocusUi ? clubShort : null}
              />
            ) : (
              <TopCommentsFeed />
            )}
            <div className="space-y-3">
              <BettorLeaderboard />
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
            </div>
          </div>
        </Card>
      </section>

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

