import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { NewsItem } from '../../data/news'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { MatchCarousel } from '../match/MatchCarousel'
import { NewsFeed } from './NewsFeed'
import { TopCommentsFeed } from './TopCommentsFeed'
import { BettorLeaderboard } from './BettorLeaderboard'
import { AdSlot } from '../ui/AdSlot'
import { SectionIntro } from '../ui/SectionIntro'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel } from '../../utils/hubSurface'
/** Infos club pour sous-titres (évite d’imposer tout le type Team depuis les hooks). */
export type HomeFeedTeamHint = { name: string; shortName: string } | null

/** Carrousel matchs + fil actus / top com. + badges — réutilisé mobile & desktop. */
export function HomeFeedContinuation({
  idPrefix,
  displayMatches,
  heroLiveMatch,
  heroLiveSim,
  personalizedNews,
  feedTab,
  setFeedTab,
  supporterFocusUi,
  clubFocusLabel,
  team,
  wrapClassName,
}: {
  idPrefix: string
  displayMatches: Match[]
  heroLiveMatch: Match | null
  heroLiveSim: LiveEncartSimulation
  personalizedNews: NewsItem[]
  feedTab: 'actu' | 'comments'
  setFeedTab: (t: 'actu' | 'comments') => void
  supporterFocusUi: boolean
  clubFocusLabel: string
  team: HomeFeedTeamHint
  wrapClassName?: string
}) {
  const { appearance } = useAppearance()
  const isLight = appearance === 'light'
  const pid = (s: string) => `${idPrefix}${s}`

  return (
    <div className={cn('mx-auto w-full min-w-0 max-w-tf-content space-y-6 sm:space-y-8', wrapClassName)}>
      <div className={cn('rounded-[20px] p-3 sm:p-4 lg:rounded-2xl', hubGlassPanel(appearance))}>
        <section className="min-w-0" aria-labelledby={pid('home-carousel-heading')}>
          <Card
            className="flex flex-col overflow-visible border-2 border-sky-400/45 p-4 shadow-[0_12px_40px_rgba(14,165,233,0.12)] ring-1 ring-sky-300/30 sm:p-5"
            elevation="soft"
          >
            <MatchCarousel
              matches={displayMatches}
              eyebrow={supporterFocusUi && clubFocusLabel ? `FOCUS ${clubFocusLabel}` : 'LIVE & À VENIR'}
              title={supporterFocusUi && clubFocusLabel ? `À l’affiche — ${clubFocusLabel}` : 'À l’affiche'}
              titleId={pid('home-carousel-heading')}
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

        <div className="mt-5 sm:mt-6">
          <AdSlot
            tone="sky"
            brand="Partenaire carrousel"
            body="Entre le carrousel des matchs et le fil actus / top commentaires."
            imageSeed="home-carousel-feed"
          />
        </div>

        <section className="mt-6 min-w-0 lg:mt-8" aria-labelledby={pid('home-feed-heading')}>
          <Card className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6" elevation="soft">
            <SectionIntro
              section="home"
              titleId={pid('home-feed-heading')}
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
                id={pid('home-feed-tab-actu')}
                aria-controls={pid('home-feed-panel')}
                onClick={() => setFeedTab('actu')}
                className={cn(
                  'tf-interactive-press min-h-11 rounded-2xl px-3 py-2.5 text-center text-xs font-black sm:min-h-0 sm:px-4 sm:text-sm',
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
                id={pid('home-feed-tab-comments')}
                aria-controls={pid('home-feed-panel')}
                onClick={() => setFeedTab('comments')}
                className={cn(
                  'tf-interactive-press min-h-11 rounded-2xl px-3 py-2.5 text-center text-xs font-black sm:min-h-0 sm:px-4 sm:text-sm',
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
              id={pid('home-feed-panel')}
              role="tabpanel"
              aria-labelledby={feedTab === 'actu' ? pid('home-feed-tab-actu') : pid('home-feed-tab-comments')}
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

      <div
        className={cn(
          'flex flex-wrap justify-center gap-2 rounded-2xl border px-3 py-3 pb-2',
          isLight
            ? 'border-tf-dark/10 bg-white/85 shadow-sm'
            : 'border-tf-dark/12 bg-gradient-to-r from-tf-night/[0.06] via-tf-ice/70 to-tf-night/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
        )}
      >
        <Badge tone="navy">💬 Général</Badge>
        <Badge tone="navy">🧾 Transferts{supporterFocusUi && clubFocusLabel ? ` ${clubFocusLabel}` : ''}</Badge>
        <Badge tone="live">🎯 Pronos{supporterFocusUi && clubFocusLabel ? ` ${clubFocusLabel}` : ''}</Badge>
        <Badge tone="navy">😂 Memes</Badge>
      </div>
    </div>
  )
}
