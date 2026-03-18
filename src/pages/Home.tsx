import { upcomingMatches } from '../data/matches'
import { mockNews } from '../data/news'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MatchCarousel } from '../components/match/MatchCarousel'
import { NewsFeed } from '../components/home/NewsFeed'
import { AdSlot } from '../components/ui/AdSlot'
import { Link } from 'react-router-dom'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { GroupCard } from '../components/group/GroupCard'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { useState } from 'react'

export function HomePage() {
  const { groups, createGroup } = useSupporterGroups()
  const topGroups = groups.slice(0, 5)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      <Card className="p-3 sm:p-4" elevation="soft">
        <MatchCarousel
          matches={upcomingMatches}
          title="Matchs"
          subtitle="Découvre les matchs en direct et ceux qui arrivent (carrousel auto)."
        />
      </Card>

      <section id="trending" className="space-y-3">
        <Card className="p-4 sm:p-5" elevation="soft">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-wide text-slate-700">
                COMMUNAUTÉ
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Groupes de supporters
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-700 sm:text-base">
                Des serveurs de supporters (identité + salons + thème) — séparés
                des matchs en direct.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                className="rounded-3xl px-5"
                onClick={() => setCreateOpen(true)}
              >
                Créer un serveur
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_360px]">
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

            <Card elevation="none" className="bg-white/70 p-5">
              <div className="text-sm font-black text-slate-900">
                Comment ça marche
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-700">
                Un serveur = un groupe de supporters. Il a son thème et ses
                salons (général, transferts, pronos…).
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge>💬 Général</Badge>
                <Badge>🧾 Transferts</Badge>
                <Badge>🎯 Pronos</Badge>
                <Badge>😂 Memes</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="soft"
                  className="rounded-3xl px-5"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Revenir aux matchs
                </Button>
                <Link to="/calendar">
                  <Button variant="primary" className="rounded-3xl px-5">
                    Voir le calendrier
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-wide text-slate-700">
              ACTU
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Actu
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-700 sm:text-base">
              Une revue style journaliste + emplacements pubs (mock).
            </p>
          </div>
        </div>

        <Card className="p-3 sm:p-4" elevation="soft">
          <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
            <NewsFeed items={mockNews} />
            <div className="space-y-3">
              <AdSlot
                tone="navy"
                brand="BetMock"
                body="Boost de cote — offre fictive pour visualiser une pub premium."
              />
              <AdSlot
                tone="blue"
                brand="Sponsor: UltraWear"
                body="Nouveau maillot 25/26 — placement publicitaire (mock)."
              />
              <AdSlot
                tone="sky"
                brand="Streaming+"
                body="Regarde le match en HD — emplacement pub (mock)."
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

