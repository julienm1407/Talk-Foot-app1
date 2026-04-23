import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { HubMatchStrip } from '../components/match/HubMatchEncart'
import { MatchSpotlightCard } from '../components/match/MatchSpotlightCard'
import { Card } from '../components/ui/Card'
import { HubEncartTopAccent } from '../components/ui/HubEncartTopAccent'
import { themeForCompetition } from '../data/competitionThemes'
import { cn } from '../utils/cn'
import {
  MATCH_DISPLAY_TIME_ZONE,
  matchCalendarDayKeyParis,
  parisCalendarDayAfter,
} from '../utils/time'
import { useAppearance } from '../contexts/AppearanceContext'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'

export function CalendarPage() {
  const now = Date.now()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { supporterTintActive, team } = useSupporterTintMode()

  const { matches, loading, error: matchesError } = useMatches()

  const hasSportMonksMatches = useMemo(
    () => matches.some((m) => m.provider === 'sportmonks'),
    [matches],
  )

  const filterBtn = (selected: boolean) =>
    cn(
      'min-h-tf-touch w-full rounded-tf-xl px-tf-4 py-tf-2.5 text-left text-tf-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      L
        ? selected
          ? 'bg-tf-dark text-white shadow-tf-elev-1 focus-visible:ring-tf-electric/40 focus-visible:ring-offset-[color:var(--tf-page-bg-light)]'
          : 'border border-tf-grey-pastel/60 bg-tf-white text-tf-dark hover:bg-tf-grey-pastel/30 focus-visible:ring-tf-electric/40 focus-visible:ring-offset-white'
        : selected
          ? 'bg-white/18 text-white shadow-md ring-1 ring-white/25 focus-visible:ring-sky-400/50 focus-visible:ring-offset-[#071422]'
          : 'border border-white/22 bg-white/[0.07] text-tf-app-fg hover:border-white/30 hover:bg-white/12 focus-visible:ring-sky-400/45 focus-visible:ring-offset-[#071422]',
    )

  const filterChip = (selected: boolean) =>
    cn(
      'shrink-0 rounded-tf-xl px-tf-4 py-tf-2.5 text-tf-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      L
        ? selected
          ? 'bg-tf-dark text-white focus-visible:ring-tf-electric/40 focus-visible:ring-offset-white'
          : 'border border-tf-grey-pastel/60 bg-tf-white text-tf-dark hover:bg-tf-grey-pastel/30 focus-visible:ring-tf-grey/40 focus-visible:ring-offset-white'
        : selected
          ? 'bg-white/18 text-white ring-1 ring-white/25 focus-visible:ring-sky-400/50 focus-visible:ring-offset-[#071422]'
          : 'border border-white/22 bg-white/[0.07] text-tf-app-fg hover:bg-white/12 focus-visible:ring-sky-400/45 focus-visible:ring-offset-[#071422]',
    )

  const sectionHeading = cn(
    'text-tf-xs font-black uppercase tracking-[0.18em]',
    L ? 'text-tf-electric-deep' : 'text-sky-100',
  )

  /** Tous les matchs de la fenêtre API (y compris terminés) : même jour que les résultats du matin. */
  const sorted = useMemo(() => {
    return [...matches].sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
  }, [matches])

  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; shortName: string }>()
    for (const m of sorted) map.set(m.competition.id, m.competition)
    return Array.from(map.values()).sort((a, b) => a.shortName.localeCompare(b.shortName))
  }, [sorted])

  const [competitionId, setCompetitionId] = useState<string>('all')
  const [dayKey, setDayKey] = useState<string>('all')

  const poolFiltered = useMemo(() => {
    return competitionId === 'all'
      ? sorted
      : sorted.filter((m) => m.competition.id === competitionId)
  }, [competitionId, sorted])

  const liveFeatured = useMemo(() => poolFiltered.filter((m) => m.status === 'live'), [poolFiltered])

  /** Jusqu’à 4 lives en tête de page ; le reste reste dans la liste par jour */
  const liveAgendaFeatured = useMemo(() => liveFeatured.slice(0, 4), [liveFeatured])

  const upcomingSpotlight = useMemo(() => {
    if (liveFeatured.length > 0) return null
    const upcomingOnly = poolFiltered.filter((m) => m.status === 'upcoming')
    return (
      upcomingOnly.find((m) => +new Date(m.kickoffAt) >= now - 60_000) ?? upcomingOnly[0] ?? null
    )
  }, [liveFeatured.length, poolFiltered, now])

  const excludedIds = useMemo(() => {
    const s = new Set<string>()
    liveAgendaFeatured.forEach((m) => s.add(m.id))
    if (upcomingSpotlight) s.add(upcomingSpotlight.id)
    return s
  }, [liveAgendaFeatured, upcomingSpotlight])

  const filtered = useMemo(() => {
    const base =
      competitionId === 'all'
        ? sorted
        : sorted.filter((m) => m.competition.id === competitionId)
    return base.filter((m) => !excludedIds.has(m.id))
  }, [competitionId, sorted, excludedIds])

  const grouped = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone: MATCH_DISPLAY_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const groups = new Map<string, { ts: number; label: string; matches: typeof filtered }>()

    for (const m of filtered) {
      const d = new Date(m.kickoffAt)
      const key = matchCalendarDayKeyParis(m.kickoffAt)

      const existing = groups.get(key)
      if (existing) {
        existing.matches.push(m)
      } else {
        groups.set(key, { ts: d.getTime(), label: fmt.format(d), matches: [m] })
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[1].ts - b[1].ts)
      .map(([key, v]) => ({ key, label: v.label, matches: v.matches }))
  }, [filtered])

  const visible = useMemo(() => {
    if (dayKey === 'all') return grouped
    return grouped.filter((g) => g.key === dayKey)
  }, [dayKey, grouped])

  const dayChips = useMemo(() => {
    const todayKey = matchCalendarDayKeyParis(new Date())
    const tomorrowKey = parisCalendarDayAfter(todayKey)
    const shortFmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone: MATCH_DISPLAY_TIME_ZONE,
      weekday: 'short',
      day: 'numeric',
    })

    return grouped.slice(0, 10).map((g) => {
      const [gy, gm, gd] = g.key.split('-').map(Number)
      const labelAnchor = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0))
      const label =
        g.key === todayKey
          ? "Aujourd'hui"
          : g.key === tomorrowKey
            ? 'Demain'
            : shortFmt.format(labelAnchor)
      return { key: g.key, label, count: g.matches.length }
    })
  }, [grouped])

  const totalCount = useMemo(() => {
    const listed = visible.reduce((acc, g) => acc + g.matches.length, 0)
    return listed + liveAgendaFeatured.length + (upcomingSpotlight ? 1 : 0)
  }, [visible, liveAgendaFeatured.length, upcomingSpotlight])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className={cn('text-sm font-semibold', L ? 'text-tf-grey' : 'text-tf-app-muted')}>
          Chargement des matchs…
        </p>
      </div>
    )
  }

  const dataSourceBanner =
    matches.length > 0 && !hasSportMonksMatches ? (
      <div
        className={cn(
          'rounded-2xl border px-4 py-3 text-sm font-bold',
          L
            ? 'border-amber-500/50 bg-amber-50 text-amber-950'
            : 'border-amber-400/40 bg-amber-950/35 text-amber-50',
        )}
        role="status"
      >
        Les matchs affichés viennent du <strong>mode démo</strong> (pas de réponse SportMonks avec ta clé). Pour le
        vrai calendrier : <Link to="/settings/donnees#tf-sportmonks-cle">coller la clé SportMonks</Link> puis redémarrer
        le serveur si tu utilises <code className="font-mono text-xs">.env</code>.
      </div>
    ) : null

  const apiErrorBanner = matchesError ? (
    <p
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm font-bold',
        L ? 'border-rose-400/60 bg-rose-50 text-rose-950' : 'border-rose-400/45 bg-rose-950/40 text-rose-50',
      )}
      role="alert"
    >
      {matchesError}
    </p>
  ) : null

  const leagueButtons = (
    <>
      <button
        type="button"
        onClick={() => {
          setCompetitionId('all')
          setDayKey('all')
        }}
        className={filterBtn(competitionId === 'all')}
        aria-pressed={competitionId === 'all'}
      >
        Toutes les ligues
      </button>
      {competitions.map((c) => {
        const th = themeForCompetition(c.id)
        const selected = competitionId === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCompetitionId(c.id)
              setDayKey('all')
            }}
            className={cn(
              'min-h-tf-touch w-full rounded-tf-xl px-tf-4 py-tf-2.5 text-left text-tf-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              L
                ? selected
                  ? 'text-white shadow-md ring-2 ring-white/50 ring-offset-2 ring-offset-tf-grey-pastel/30'
                  : 'border border-tf-grey-pastel/50 opacity-90 hover:opacity-100'
                : selected
                  ? 'text-white shadow-lg ring-2 ring-white/40 ring-offset-2 ring-offset-[#071422]'
                  : 'border border-white/25 bg-white/[0.05] text-white/95 hover:border-white/40 hover:bg-white/10',
              !th && filterBtn(selected),
            )}
            style={
              th
                ? {
                    background: selected
                      ? `linear-gradient(135deg, ${th.accent}, ${th.accent2})`
                      : L
                        ? `linear-gradient(135deg, ${th.accent}33, ${th.accent2}22)`
                        : `linear-gradient(135deg, ${th.accent}66, ${th.accent2}44)`,
                  }
                : undefined
            }
            aria-pressed={selected}
          >
            {c.shortName}
          </button>
        )
      })}
    </>
  )

  const dayButtons = (
    <>
      <button
        type="button"
        onClick={() => setDayKey('all')}
        className={filterBtn(dayKey === 'all')}
        aria-pressed={dayKey === 'all'}
      >
        Tous les jours
      </button>
      {dayChips.map((d) => {
        const selected = dayKey === d.key
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => setDayKey(d.key)}
            className={filterBtn(selected)}
            aria-pressed={selected}
          >
            {d.label}
            <span className={cn('ml-1.5 font-normal', L ? 'opacity-80' : 'text-sky-100/82')}>
              ({d.count})
            </span>
          </button>
        )
      })}
    </>
  )

  const leagueChipRow = (
    <>
      <button
        type="button"
        onClick={() => {
          setCompetitionId('all')
          setDayKey('all')
        }}
        className={filterChip(competitionId === 'all')}
        aria-pressed={competitionId === 'all'}
      >
        Toutes
      </button>
      {competitions.map((c) => {
        const th = themeForCompetition(c.id)
        const selected = competitionId === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCompetitionId(c.id)
              setDayKey('all')
            }}
            className={cn(
              'shrink-0 rounded-tf-xl px-tf-4 py-tf-2.5 text-tf-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              L
                ? selected
                  ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-tf-grey-pastel/40 shadow-lg'
                  : 'opacity-50 hover:opacity-70'
                : selected
                  ? 'ring-2 ring-sky-400/55 ring-offset-2 ring-offset-[#071422] shadow-lg'
                  : 'border border-white/20 bg-white/[0.06] text-tf-app-fg hover:bg-white/11',
              th ? (L ? 'text-white focus-visible:ring-white/60' : 'text-white') : filterChip(selected),
            )}
            style={
              th
                ? {
                    background: selected
                      ? `linear-gradient(135deg, ${th.accent}, ${th.accent2})`
                      : L
                        ? `linear-gradient(135deg, ${th.accent}44, ${th.accent2}33)`
                        : `linear-gradient(135deg, ${th.accent}77, ${th.accent2}55)`,
                  }
                : undefined
            }
            aria-pressed={selected}
          >
            {c.shortName}
          </button>
        )
      })}
    </>
  )

  const dayChipRow = (
    <>
      <button
        type="button"
        onClick={() => setDayKey('all')}
        className={filterChip(dayKey === 'all')}
        aria-pressed={dayKey === 'all'}
      >
        Tous
      </button>
      {dayChips.map((d) => {
        const selected = dayKey === d.key
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => setDayKey(d.key)}
            className={filterChip(selected)}
            aria-pressed={selected}
          >
            {d.label}
            <span className={cn('ml-1.5 font-normal', L ? 'opacity-80' : 'text-sky-100/82')}>
              ({d.count})
            </span>
          </button>
        )
      })}
    </>
  )

  const asideHeading = (id: string, label: string) => (
    <h2
      id={id}
      className={cn(
        'mb-tf-2 border-b pb-tf-2 text-tf-sm font-black uppercase tracking-wider lg:mb-tf-3 lg:pb-tf-2',
        L ? 'border-tf-grey-pastel/55 text-tf-dark' : 'border-white/20 text-sky-100',
      )}
    >
      {label}
    </h2>
  )

  return (
    <div className="mx-auto w-full max-w-tf-wide space-y-tf-6 pb-tf-10 sm:space-y-tf-8">
      <header
        className={cn(
          'space-y-tf-2 border-b pb-tf-4',
          L ? 'border-tf-nav-match/25' : 'border-white/15',
        )}
      >
        <p className={sectionHeading}>Match</p>
        <h1 className="font-display text-tf-2xl font-black tracking-tight text-tf-app-fg sm:text-tf-display">
          {supporterTintActive && team ? `Match ${team.shortName}` : 'Match'}
        </h1>
        <div className="space-y-tf-3">
          {dataSourceBanner}
          {apiErrorBanner}
        </div>
        <p className="text-tf-sm font-medium text-tf-app-muted sm:text-tf-base">
          {supporterTintActive && team ? (
            <>
              Calendrier complet — {team.shortName} mis en avant.
              {totalCount > 0 && (
                <>
                  {' '}
                  {totalCount} rencontre{totalCount > 1 ? 's' : ''} affichée{totalCount > 1 ? 's' : ''}.
                </>
              )}
            </>
          ) : (
            <>
              {totalCount} match{totalCount > 1 ? 's' : ''} à l’affiche
              {competitionId !== 'all' && (
                <> · {competitions.find((c) => c.id === competitionId)?.shortName ?? ''}</>
              )}
            </>
          )}
        </p>
      </header>

      {liveFeatured.length > 0 ? (
        <section aria-labelledby="cal-live-heading" className="space-y-tf-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="cal-live-heading" className={cn(sectionHeading, 'tracking-wider')}>
              En direct
            </h2>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                L ? 'bg-tf-grey-pastel/40 text-tf-dark' : 'bg-white/[0.1] text-sky-100/90 ring-1 ring-white/15',
              )}
            >
              {liveFeatured.length} live
            </span>
          </div>
          <HubEncartTopAccent appearance={L ? 'light' : 'dark'} preset="live" />
          <div className="flex flex-wrap gap-tf-4">
            {liveAgendaFeatured.map((m) => (
              <div
                key={m.id}
                className="flex min-w-0 w-full grow basis-full sm:basis-[calc((100%-var(--tf-space-4))/2)] xl:basis-[calc((100%-3rem)/4)]"
              >
                <HubMatchStrip match={m} className="max-w-full grow" />
              </div>
            ))}
          </div>
          {liveFeatured.length > liveAgendaFeatured.length ? (
            <p className={cn('text-tf-xs font-semibold', L ? 'text-tf-grey' : 'text-tf-app-muted')}>
              +{liveFeatured.length - liveAgendaFeatured.length} autre
              {liveFeatured.length - liveAgendaFeatured.length > 1 ? 's' : ''} en direct dans la liste par jour
              ci-dessous.
            </p>
          ) : null}
        </section>
      ) : upcomingSpotlight ? (
        <section aria-labelledby="cal-featured-heading" className="space-y-tf-2">
          <h2 id="cal-featured-heading" className={sectionHeading}>
            À la une
          </h2>
          <HubEncartTopAccent appearance={L ? 'light' : 'dark'} preset="upcoming" />
          <MatchSpotlightCard match={upcomingSpotlight} className="w-full max-w-full sm:max-w-md" />
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-tf-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:items-start">
        <aside
          className="min-w-0 space-y-tf-5 lg:sticky lg:top-24 lg:self-start"
          aria-label="Filtres"
        >
          <div className="lg:hidden">
            {asideHeading('cal-league-mob', 'Ligue')}
            <div
              className="flex gap-tf-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]"
              role="group"
              aria-labelledby="cal-league-mob"
            >
              {leagueChipRow}
            </div>
          </div>

          <div className="lg:hidden">
            <div
              className={cn(
                'mb-tf-2 flex items-center justify-between border-b pb-tf-2',
                L ? 'border-tf-grey-pastel/55' : 'border-white/20',
              )}
            >
              <h2
                id="cal-day-mob"
                className={cn(
                  'text-tf-sm font-black uppercase tracking-wider',
                  L ? 'text-tf-dark' : 'text-sky-100',
                )}
              >
                Jour
              </h2>
              <span className={cn('text-tf-xs font-medium', L ? 'text-tf-grey' : 'text-sky-200/90')}>
                {dayKey === 'all' ? 'Tous' : dayChips.find((d) => d.key === dayKey)?.label}
              </span>
            </div>
            <div
              className="flex gap-tf-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
              role="group"
              aria-labelledby="cal-day-mob"
            >
              {dayChipRow}
            </div>
          </div>

          <div className="hidden lg:block">
            {asideHeading('cal-league-aside', 'Ligue')}
            <div className="flex flex-col gap-tf-2" role="group" aria-labelledby="cal-league-aside">
              {leagueButtons}
            </div>
          </div>

          <div className="hidden lg:block">
            <div
              className={cn(
                'mb-tf-3 flex items-center justify-between gap-tf-2 border-b pb-tf-2',
                L ? 'border-tf-grey-pastel/55' : 'border-white/20',
              )}
            >
              <h2
                id="cal-day-aside"
                className={cn(
                  'text-tf-sm font-black uppercase tracking-wider',
                  L ? 'text-tf-dark' : 'text-sky-100',
                )}
              >
                Jour
              </h2>
              <span className={cn('text-tf-xs', L ? 'text-tf-grey' : 'text-sky-200/90')}>
                {dayKey === 'all' ? 'Tous' : dayChips.find((d) => d.key === dayKey)?.label}
              </span>
            </div>
            <div
              className="flex max-h-[min(50vh,28rem)] flex-col gap-tf-2 overflow-y-auto pr-1"
              role="group"
              aria-labelledby="cal-day-aside"
            >
              {dayButtons}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <section aria-label="Liste des matchs par jour">
            {visible.length === 0 ? (
              <Card
                className={cn('p-tf-8 text-center', !L && 'border-white/12 bg-white/[0.04]')}
                elevation="soft"
              >
                <p className="text-tf-md font-bold text-tf-app-fg">Aucun match à afficher</p>
                <p className="mt-tf-2 text-tf-sm font-medium text-tf-app-muted">
                  {liveFeatured.length > 0 || upcomingSpotlight
                    ? 'Les matchs mis en avant sont au-dessus ; ajuste ligue ou jour.'
                    : 'Change de ligue ou de jour.'}
                </p>
                <Link
                  to="/"
                  className={cn(
                    'mt-tf-4 inline-block text-tf-sm font-black underline',
                    L ? 'text-tf-electric-deep' : 'text-sky-300',
                  )}
                >
                  Retour à l’accueil
                </Link>
              </Card>
            ) : (
              <div className="space-y-tf-8">
                {visible.map((g) => (
                  <div key={g.key}>
                    <h3
                      className={cn(
                        'mb-tf-4 border-b pb-tf-2 font-display text-tf-lg font-black uppercase tracking-wide',
                        L ? 'border-tf-grey-pastel/45 text-tf-dark' : 'border-white/15 text-tf-app-fg',
                      )}
                    >
                      {g.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-tf-4 md:grid-cols-2 md:gap-tf-6">
                      {g.matches.map((m) =>
                        m.status === 'upcoming' ? (
                          <MatchSpotlightCard key={m.id} match={m} className="h-full min-w-0" />
                        ) : (
                          <HubMatchStrip key={m.id} match={m} />
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
