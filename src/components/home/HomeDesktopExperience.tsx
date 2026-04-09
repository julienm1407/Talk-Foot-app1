/**
 * Hub accueil desktop (≥xl) — inspiration maquette TalkFoot : 3 colonnes, verre sombre,
 * matchs live horizontaux, tribunes, premium, rail droit (groupes + top débats).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel } from '../../utils/hubSurface'
import type { Match } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import type { Debate } from '../../data/debates'
import { useLiveEncartSimulation } from '../../hooks/useLiveEncartSimulation'
import { cn } from '../../utils/cn'
import { HubStripUpcoming } from '../match/HubMatchEncart'
import { LiveMatchHero } from './LiveMatchHero'
import { HomeLandingHub } from './HomeLandingHub'
import { HomeMonEspacePanel } from './HomeMonEspacePanel'
import { DebateOfTheDayCard } from './DebateOfTheDayCard'
import { TribuneShowcaseCard } from '../tribune/TribuneShowcaseCard'
import { HomeSiteSearch } from '../search/HomeSiteSearch'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'

function DesktopHubLiveStrip({
  match,
  fillColumnHeight,
  carousel,
}: {
  match: Match
  /** Une seule live + colonne « À venir » : aligner les hauteurs */
  fillColumnHeight?: boolean
  carousel?: { count: number; index: number; onSelect: (i: number) => void }
}) {
  const simulation = useLiveEncartSimulation(match)
  return (
    <LiveMatchHero
      match={match}
      simulation={simulation}
      variant="spotlight"
      fillColumnHeight={fillColumnHeight}
      carousel={carousel}
      className={cn(
        'w-full min-w-0 max-w-none',
        fillColumnHeight ? 'h-full min-h-0 self-stretch' : 'h-auto self-start',
      )}
    />
  )
}

export function HomeDesktopExperience({
  liveMatches,
  upcomingMatches,
  tribuneGroups,
  supporterGroupsPool,
  myCreatedGroups,
  trendingDebates,
  debateOfTheDay,
  onCreateTribune,
}: {
  liveMatches: Match[]
  upcomingMatches: Match[]
  tribuneGroups: SupporterGroup[]
  /** Tous les salons visibles (hors rivaux masqués) — pour le rail sans doublon avec la grille tribunes */
  supporterGroupsPool: SupporterGroup[]
  /** Tribunes / groupes créés par l’utilisateur (stockage local) */
  myCreatedGroups: SupporterGroup[]
  trendingDebates: Debate[]
  debateOfTheDay: Debate
  onCreateTribune: () => void
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const card = hubGlassPanel(appearance)
  const railHeadBorder = L ? 'border-b border-tf-dark/10' : 'border-b border-white/10'
  const linkSky = L
    ? 'text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline'
    : 'text-xs font-bold text-sky-300 hover:text-sky-200 hover:underline'
  const linkSkySm = L
    ? 'text-sm font-black text-sky-700 hover:underline'
    : 'text-sm font-black text-sky-300 hover:underline'
  const linkOrange = L
    ? 'mt-3 block text-center text-xs font-black text-orange-700 hover:text-orange-900 hover:underline'
    : 'mt-3 block text-center text-xs font-black text-orange-300/90 hover:text-orange-200 hover:underline'
  const hubSectionCaps = L ? 'text-tf-dark/90' : 'text-sky-100'
  const hubSecondary = L ? 'text-tf-dark/72' : 'text-sky-200/95'
  const debateRow = L
    ? 'flex gap-3 rounded-xl border border-tf-dark/10 bg-white/85 p-2.5 transition hover:border-orange-400/40 hover:bg-white'
    : 'flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 transition hover:border-orange-400/30 hover:bg-white/[0.07]'
  const [deskLiveIndex, setDeskLiveIndex] = useState(0)

  const liveIdsKey = liveMatches.map((m) => m.id).join('|')
  useEffect(() => {
    setDeskLiveIndex(0)
  }, [liveIdsKey])

  const upcomingSorted = useMemo(() => {
    return [...upcomingMatches]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
  }, [upcomingMatches])

  const hasLive = liveMatches.length > 0
  const showUpcomingInHeader = !hasLive && upcomingSorted.length > 0
  const showMixedHeader = hasLive && upcomingSorted.length > 0
  /** À côté du live : 2 bandeaux compacts (largeur live = 2× cette colonne) */
  const headerUpcomingPrimary = upcomingSorted.slice(0, 2)
  const liveMatchesPreview = liveMatches.slice(0, 2)
  const topDebates = trendingDebates.slice(0, 5)
  const tribunes = tribuneGroups.slice(0, 4)

  /** Peu de salons dans le rail : laisse « Top débats » plus haut dans la colonne */
  const railSpotlightMax = 2
  const railSpotlightGroups = useMemo(() => {
    const centerIds = new Set(tribuneGroups.map((g) => g.id))
    const others = supporterGroupsPool.filter((g) => !centerIds.has(g.id)).slice(0, railSpotlightMax)
    if (others.length > 0) return others
    return tribuneGroups.slice(0, railSpotlightMax)
  }, [tribuneGroups, supporterGroupsPool])

  return (
    <div className="grid w-full min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,18rem)] xl:gap-8 2xl:gap-10">
      {/* ——— Colonne perso : favoris & tribunes créées (navigation = header) ——— */}
      <HomeMonEspacePanel
        myCreatedGroups={myCreatedGroups}
        onCreateTribune={onCreateTribune}
        className="flex flex-col gap-5 overflow-hidden p-0"
      />

      {/* ——— Centre : raccourcis puis matchs compacts ——— */}
      <div className="min-w-0 w-full space-y-4 sm:space-y-5 xl:mx-auto xl:max-w-6xl 2xl:max-w-7xl">
        <HomeLandingHub
          appearance={appearance}
          className={cn(card)}
          compact
          onCreateGroup={onCreateTribune}
          desktopToolbar={<HomeSiteSearch className="w-full min-w-0" inputId="home-desktop-search" />}
        />

        <section
          aria-labelledby="desk-matches-primary-heading"
          className={cn(card, 'flex flex-col overflow-hidden pb-2.5 pt-0 sm:pb-3')}
        >
          <HubEncartTopAccent appearance={appearance} preset={hasLive ? 'live' : 'upcoming'} />
          <div className="space-y-3 px-4 pt-3 sm:space-y-3.5 sm:px-5 sm:pt-4">
          {hasLive ? (
            <div className="space-y-3 sm:space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2
                    id="desk-matches-primary-heading"
                    className="min-w-0 font-display text-lg font-black text-tf-app-fg sm:text-xl"
                  >
                    Matchs en direct
                  </h2>
                  <span className="shrink-0 rounded-md bg-tf-cta px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                    LIVE
                  </span>
                </div>
                <Link to="/match" className={cn(linkSky, 'shrink-0')}>
                  Voir tout
                </Link>
              </div>
              {showMixedHeader ? (
                <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(200px,1fr)] xl:items-start xl:gap-4">
                  <div
                    className={cn(
                      'grid min-w-0 gap-3',
                      liveMatchesPreview.length > 1
                        ? 'auto-rows-auto grid-cols-1 items-start sm:grid-cols-2'
                        : 'grid-cols-1',
                    )}
                  >
                    {liveMatchesPreview.length === 1 ? (
                      <DesktopHubLiveStrip
                        match={liveMatches[deskLiveIndex] ?? liveMatches[0]}
                        fillColumnHeight={false}
                        carousel={
                          liveMatches.length > 1
                            ? {
                                count: liveMatches.length,
                                index: deskLiveIndex,
                                onSelect: setDeskLiveIndex,
                              }
                            : undefined
                        }
                      />
                    ) : (
                      liveMatchesPreview.map((m) => (
                        <DesktopHubLiveStrip key={m.id} match={m} fillColumnHeight={false} />
                      ))
                    )}
                  </div>
                  <aside
                    className={cn(
                      'flex min-w-0 flex-col gap-2 border-t pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0',
                      L ? 'border-tf-dark/10 xl:border-tf-dark/10' : 'border-white/10 xl:border-white/10',
                    )}
                    aria-labelledby="desk-upcoming-secondary-heading"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3
                        id="desk-upcoming-secondary-heading"
                        className={cn('text-[10px] font-black uppercase tracking-[0.14em]', hubSectionCaps)}
                      >
                        À venir
                      </h3>
                      <Link to="/match" className={cn(linkSky, 'shrink-0')}>
                        Calendrier
                      </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                      {headerUpcomingPrimary.map((m) => (
                        <HubStripUpcoming
                          key={m.id}
                          match={m}
                          visualSize="sidebar"
                          className="h-auto w-full self-start"
                        />
                      ))}
                    </div>
                  </aside>
                  {liveMatches.length > 2 ? (
                    <p className={cn('text-[10px] font-bold xl:col-span-2', hubSecondary)}>
                      +{liveMatches.length - 2} autre{liveMatches.length - 2 > 1 ? 's' : ''} en direct —{' '}
                      <Link to="/match" className={cn(linkSky)}>
                        tout voir
                      </Link>
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid min-w-0 auto-rows-auto grid-cols-1 items-start gap-3 sm:grid-cols-2">
                    {liveMatchesPreview.length === 1 ? (
                      <DesktopHubLiveStrip
                        match={liveMatches[deskLiveIndex] ?? liveMatches[0]}
                        carousel={
                          liveMatches.length > 1
                            ? {
                                count: liveMatches.length,
                                index: deskLiveIndex,
                                onSelect: setDeskLiveIndex,
                              }
                            : undefined
                        }
                      />
                    ) : (
                      liveMatchesPreview.map((m) => (
                        <DesktopHubLiveStrip key={m.id} match={m} />
                      ))
                    )}
                  </div>
                  {liveMatches.length > 2 ? (
                    <p className={cn('text-[10px] font-bold', hubSecondary)}>
                      +{liveMatches.length - 2} autre{liveMatches.length - 2 > 1 ? 's' : ''} —{' '}
                      <Link to="/match" className={cn(linkSky)}>
                        Voir tout
                      </Link>
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : showUpcomingInHeader ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2
                  id="desk-matches-primary-heading"
                  className="min-w-0 font-display text-lg font-black text-tf-app-fg sm:text-xl"
                >
                  Prochains matchs
                </h2>
                <Link to="/match" className={cn(linkSky, 'shrink-0')}>
                  Voir tout
                </Link>
              </div>
              <div className="grid min-w-0 auto-rows-auto grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {headerUpcomingPrimary.map((m) => (
                  <HubStripUpcoming key={m.id} match={m} className="h-auto self-start" />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2 text-center sm:p-3">
              <h2 id="desk-matches-primary-heading" className="sr-only">
                Matchs
              </h2>
              <p className="text-sm font-semibold text-tf-app-fg">Aucun live pour l’instant.</p>
              <Link to="/match" className={cn('mt-2 inline-block', linkSkySm)}>
                Voir les matchs
              </Link>
            </div>
          )}
          </div>
        </section>

        <section aria-labelledby="desk-debate-day-heading" className="min-w-0">
          <h2 id="desk-debate-day-heading" className="sr-only">
            Débat du jour
          </h2>
          <DebateOfTheDayCard debate={debateOfTheDay} />
        </section>

        <section aria-labelledby="desk-tribunes-heading" className="min-w-0">
          <h2
            id="desk-tribunes-heading"
            className="font-display text-lg font-black leading-snug tracking-tight text-tf-app-fg sm:text-xl lg:text-2xl"
          >
            En direct maintenant
          </h2>
          <p
            className={cn(
              'mt-2 max-w-prose text-pretty text-sm font-semibold leading-relaxed sm:text-[0.9375rem]',
              hubSecondary,
            )}
          >
            Choisis ta tribune et rejoins la conversation.
          </p>
          <div className="mt-5 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 2xl:gap-5">
            {tribunes.map((g) => (
              <TribuneShowcaseCard key={g.id} group={g} variant="grid" className="min-h-0 min-w-0" />
            ))}
          </div>
        </section>

      </div>

      {/* ——— Rail droit : salons d’abord, puis top débats (débat du jour = plein format sous les matchs au centre) ——— */}
      <aside className="flex min-w-0 flex-col gap-5">
        <div className={cn('overflow-hidden', card, 'p-0')}>
          <HubEncartTopAccent appearance={appearance} preset="tribune" />
          <div className="p-4">
          <h3 className={cn('pb-2 font-display text-xs font-black uppercase tracking-[0.18em] text-tf-app-fg', railHeadBorder)}>
            Salons à découvrir
          </h3>
          <ul className="mt-3 space-y-3" role="list">
            {railSpotlightGroups.length === 0 ? (
              <li className={cn('text-xs font-semibold', hubSecondary)}>Aucun groupe pour l’instant.</li>
            ) : (
              railSpotlightGroups.map((g) => (
                <li key={g.id}>
                  <TribuneShowcaseCard group={g} variant="rail" />
                </li>
              ))
            )}
          </ul>
          <Link to="/groups" className={cn('mt-3 block text-center', linkSky)}>
            Tous les groupes
          </Link>
          </div>
        </div>

        <div className={cn('overflow-hidden', card, 'p-0')}>
          <HubEncartTopAccent appearance={appearance} preset="debate" />
          <div className="p-4">
          <h3 className={cn('pb-2 font-display text-xs font-black uppercase tracking-[0.18em] text-tf-app-fg', railHeadBorder)}>
            Top débats
          </h3>
          <ol className="mt-3 space-y-2" role="list">
            {topDebates.map((d, i) => (
              <li key={d.id}>
                <Link to={`/debate/${d.id}`} className={debateRow}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-orange-500 to-rose-600 text-sm font-black text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-tf-app-fg">{d.title}</p>
                    <p className={cn('mt-1 flex items-center gap-1 text-[10px] font-bold', hubSecondary)}>
                      <span aria-hidden>🔥</span>
                      {d.messagesCount.toLocaleString('fr-FR')} réponses
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link to="/debates" className={linkOrange}>
            Tous les débats
          </Link>
          </div>
        </div>
      </aside>
    </div>
  )
}
