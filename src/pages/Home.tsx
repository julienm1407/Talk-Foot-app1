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
import { useState } from 'react'
import { cn } from '../utils/cn'

export function HomePage() {
  const { carouselMatches, loading } = useMatches()
  const { groups, createGroup } = useSupporterGroups()
  const topGroups = groups.slice(0, 5)
  const [createOpen, setCreateOpen] = useState(false)
  const [feedTab, setFeedTab] = useState<'actu' | 'comments'>('comments')

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-visible p-4 sm:p-5" elevation="soft">
        <div className="grid gap-3 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] lg:items-start">
          <aside className="min-w-0 max-h-[280px] overflow-y-auto sm:max-h-[320px] lg:max-h-[300px]">
            <MatchQuickAccess matches={carouselMatches} />
          </aside>
          <div className="min-w-0">
            <MatchCarousel
              matches={carouselMatches}
              title="Matchs"
              subtitle=""
            />
          </div>
        </div>
      </Card>

      <section id="trending" className="space-y-4">
        <Card className="p-5 sm:p-6" elevation="soft">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
            <h2 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
              Groupes de supporters
            </h2>
            <Button
              variant="primary"
              className="rounded-3xl px-5"
              onClick={() => setCreateOpen(true)}
            >
              Créer un serveur
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_minmax(260px,320px)]">
            <div className="space-y-2">
              {topGroups.map((g) => (
                <Link
                  key={g.id}
                  to={`/group/${g.id}`}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  aria-label={`Ouvrir le groupe ${g.name}`}
                >
                  <GroupCard group={g} />
                </Link>
              ))}
            </div>

            <div className="flex flex-col rounded-2xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/10 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-tight text-tf-dark">
                  Créer un serveur
                </h3>
                <Button
                  variant="soft"
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs"
                  onClick={() => setCreateOpen(true)}
                >
                  Mode avancé
                </Button>
              </div>
              <div className="mt-3">
                <QuickCreateGroupForm onCreate={createGroup} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge>💬 Général</Badge>
                <Badge>🧾 Transferts</Badge>
                <Badge>🎯 Pronos</Badge>
                <Badge>😂 Memes</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link to="/calendar">
                  <Button variant="primary" className="rounded-3xl px-5">
                    Calendrier
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <Card className="p-5 sm:p-6" elevation="soft">
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFeedTab('actu')}
              className={cn(
                'rounded-2xl px-4 py-2.5 text-sm font-black transition',
                feedTab === 'actu'
                  ? 'bg-tf-dark text-tf-white'
                  : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
              )}
            >
              Actu
            </button>
            <button
              type="button"
              onClick={() => setFeedTab('comments')}
              className={cn(
                'rounded-2xl px-4 py-2.5 text-sm font-black transition',
                feedTab === 'comments'
                  ? 'bg-tf-dark text-tf-white'
                  : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
              )}
            >
              <span className="hidden sm:inline">Commentaires marquants</span>
              <span className="sm:hidden">Commentaires</span>
            </button>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_minmax(280px,360px)]">
            {feedTab === 'actu' ? (
              <NewsFeed items={mockNews} />
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

