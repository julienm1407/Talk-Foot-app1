import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { HubMatchStrip, HubRailRowLive } from '../components/match/HubMatchEncart'
import { MatchSpotlightCard } from '../components/match/MatchSpotlightCard'
import { Card } from '../components/ui/Card'
import { HubEncartTopAccent } from '../components/ui/HubEncartTopAccent'
import { competitionThemes, themeForCompetition } from '../data/competitionThemes'
import type { Match } from '../types/match'
import { cn } from '../utils/cn'
import {
  getFootballCalendarWindow,
} from '../utils/footballCalendarWindow'
import {
  MATCH_DISPLAY_TIME_ZONE,
  matchCalendarDayKeyParis,
  parisCalendarDayAfter,
  startOfParisCalendarDayMs,
} from '../utils/time'
import { useAppearance } from '../contexts/AppearanceContext'
import { useOptionalSeasonMode } from '../contexts/SeasonModeContext'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'

/** Matchs mis en avant sous « À la une » (hors live) — prochains coup d’envoi. */
const CALENDAR_ALAUNE_MAX = 8

type ParisDayGroup = { key: string; label: string; ts: number; matches: Match[] }

function groupMatchesByParisDay(matches: Match[], order: 'asc' | 'desc'): ParisDayGroup[] {
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: MATCH_DISPLAY_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const groups = new Map<string, { ts: number; label: string; matches: Match[] }>()
  for (const m of matches) {
    const d = new Date(m.kickoffAt)
    const key = matchCalendarDayKeyParis(m.kickoffAt)
    const existing = groups.get(key)
    if (existing) existing.matches.push(m)
    else groups.set(key, { ts: d.getTime(), label: fmt.format(d), matches: [m] })
  }
  const rows = Array.from(groups.entries()).map(([key, v]) => ({
    key,
    label: v.label,
    ts: v.ts,
    matches: v.matches,
  }))
  rows.sort((a, b) => (order === 'asc' ? a.ts - b.ts : b.ts - a.ts))
  return rows
}

export function CalendarPage() {
  const now = Date.now()
  const [searchParams] = useSearchParams()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { supporterTintActive, team } = useSupporterTintMode()
  const season = useOptionalSeasonMode()
  const isCdm = season?.isCdm2026 ?? false

  const { matches, loading, error: matchesError } = useMatches()

  const hasSportMonksMatches = useMemo(
    () => matches.some((m) => m.provider === 'sportmonks'),
    [matches],
  )

  /** Fenêtre glissante Paris (quota API). */
  const calendarWindow = useMemo(() => getFootballCalendarWindow(new Date()), [matches])

  const filterChip = (selected: boolean) =>
    cn(
      'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-3 sm:py-1.5 sm:text-xs',
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

  /** Fenêtre glissante Paris (quota API) : lives toujours inclus, le reste borné comme `fixtures/between`. */
  const sorted = useMemo(() => {
    const w = calendarWindow
    return [...matches]
      .filter((m) => {
        if (m.status === 'live') return true
        const t = new Date(m.kickoffAt).getTime()
        return t >= w.cutoffMs && t <= w.endMs
      })
      .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
  }, [calendarWindow, matches])

  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; shortName: string }>()
    for (const m of sorted) map.set(m.competition.id, m.competition)
    return Array.from(map.values()).sort((a, b) => a.shortName.localeCompare(b.shortName))
  }, [sorted])

  const [competitionId, setCompetitionId] = useState<string>('all')
  const [dayKey, setDayKey] = useState<string>('all')
  /** Vue principale : accès direct aux résultats sans défiler les à venir. */
  const [primaryTab, setPrimaryTab] = useState<'upcoming' | 'past'>('upcoming')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const resultsSectionRef = useRef<HTMLDivElement>(null)

  const compFromUrl = searchParams.get('comp')?.trim() ?? ''
  useEffect(() => {
    if (!compFromUrl) return
    if (compFromUrl === 'all' || competitionThemes[compFromUrl]) {
      setCompetitionId(compFromUrl)
    }
  }, [compFromUrl])

  const poolFiltered = useMemo(() => {
    return competitionId === 'all'
      ? sorted
      : sorted.filter((m) => m.competition.id === competitionId)
  }, [competitionId, sorted])

  const liveFeatured = useMemo(() => poolFiltered.filter((m) => m.status === 'live'), [poolFiltered])
  const isMultiplex = liveFeatured.length > 1

  const upcomingSpotlightMatches = useMemo(() => {
    if (isCdm) return [] as Match[]
    if (liveFeatured.length > 0) return [] as Match[]
    const upcomingOnly = poolFiltered
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    if (!upcomingOnly.length) return []
    const anchorIdx = upcomingOnly.findIndex((m) => +new Date(m.kickoffAt) >= now - 60_000)
    const start = anchorIdx >= 0 ? anchorIdx : 0
    return upcomingOnly.slice(start, start + CALENDAR_ALAUNE_MAX)
  }, [isCdm, liveFeatured.length, poolFiltered, now])

  const excludedIds = useMemo(() => {
    const s = new Set<string>()
    upcomingSpotlightMatches.forEach((m) => s.add(m.id))
    return s
  }, [upcomingSpotlightMatches])

  const filtered = useMemo(() => {
    const base =
      competitionId === 'all'
        ? sorted
        : sorted.filter((m) => m.competition.id === competitionId)
    return base.filter((m) => !excludedIds.has(m.id))
  }, [competitionId, sorted, excludedIds])

  /** Prochains matchs (à venir, coup d’envoi ≥ début du jour Paris). */
  const groupedUpcoming = useMemo(() => {
    const startTodayParisMs = startOfParisCalendarDayMs(matchCalendarDayKeyParis(new Date()))
    const upcomingOnly = filtered.filter(
      (m) => m.status === 'upcoming' && +new Date(m.kickoffAt) >= startTodayParisMs - 60_000,
    )
    return groupMatchesByParisDay(upcomingOnly, 'asc')
  }, [filtered])

  /** Résultats terminés dans la fenêtre (hors lives / encarts déjà sortis). */
  const groupedPast = useMemo(() => {
    const pastOnly = filtered.filter((m) => m.status === 'finished')
    return groupMatchesByParisDay(pastOnly, 'desc')
  }, [filtered])

  const visibleUpcoming = useMemo(() => {
    if (dayKey === 'all') return groupedUpcoming
    return groupedUpcoming.filter((g) => g.key === dayKey)
  }, [dayKey, groupedUpcoming])

  const visiblePast = useMemo(() => {
    if (dayKey === 'all') return groupedPast
    return groupedPast.filter((g) => g.key === dayKey)
  }, [dayKey, groupedPast])

  const dayChips = useMemo(() => {
    const todayKey = matchCalendarDayKeyParis(new Date())
    const tomorrowKey = parisCalendarDayAfter(todayKey)
    const shortFmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone: MATCH_DISPLAY_TIME_ZONE,
      weekday: 'short',
      day: 'numeric',
    })
    const merged = new Map<string, { key: string; label: string; ts: number; count: number }>()
    for (const g of groupedUpcoming) {
      merged.set(g.key, { key: g.key, label: g.label, ts: g.ts, count: g.matches.length })
    }
    for (const g of groupedPast) {
      const ex = merged.get(g.key)
      if (ex) ex.count += g.matches.length
      else merged.set(g.key, { key: g.key, label: g.label, ts: g.ts, count: g.matches.length })
    }
    const sortedKeys = [...merged.values()]
      .sort((a, b) => (primaryTab === 'past' ? b.ts - a.ts : a.ts - b.ts))
      .slice(0, 14)
    return sortedKeys.map((row) => {
      const [gy, gm, gd] = row.key.split('-').map(Number)
      const labelAnchor = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0))
      const label =
        row.key === todayKey
          ? "Aujourd'hui"
          : row.key === tomorrowKey
            ? 'Demain'
            : shortFmt.format(labelAnchor)
      return { key: row.key, label, count: row.count }
    })
  }, [groupedPast, groupedUpcoming, primaryTab])

  const upcomingTotal = useMemo(
    () => groupedUpcoming.reduce((acc, g) => acc + g.matches.length, 0),
    [groupedUpcoming],
  )
  const pastTotal = useMemo(
    () => groupedPast.reduce((acc, g) => acc + g.matches.length, 0),
    [groupedPast],
  )

  const prevTab = useRef(primaryTab)
  useEffect(() => {
    if (primaryTab === 'past' && prevTab.current !== 'past') {
      queueMicrotask(() =>
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    }
    prevTab.current = primaryTab
  }, [primaryTab])

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
              'shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:py-2 sm:text-sm',
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

  const tabBtn = (active: boolean) =>
    cn(
      'min-h-8 flex-1 rounded-lg px-2 py-1.5 text-center text-[11px] font-black uppercase tracking-wide transition sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs',
      L
        ? active
          ? 'bg-white text-tf-dark shadow-sm'
          : 'text-tf-grey hover:bg-black/[0.03] hover:text-tf-dark'
        : active
          ? 'bg-white/20 text-white shadow-inner'
          : 'text-tf-app-muted hover:bg-white/[0.06] hover:text-tf-app-fg',
    )

  const quickCompetitionChips = (() => {
    const base = competitions.slice(0, 4)
    if (competitionId === 'all') return base
    if (base.some((c) => c.id === competitionId)) return base
    const selected = competitions.find((c) => c.id === competitionId)
    return selected ? [...base.slice(0, 3), selected] : base
  })()
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
        <div className="space-y-tf-2">
          {dataSourceBanner}
          {apiErrorBanner}
          <p className="text-sm font-medium leading-snug text-tf-app-muted sm:text-base">
            {liveFeatured.length > 0 ? (
              <>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {liveFeatured.length} en direct
                </span>
                <span className="mx-1.5 font-normal text-tf-app-subtle">·</span>
              </>
            ) : null}
            <span className="font-black text-tf-app-fg">{upcomingTotal}</span> à venir
            <span className="mx-1.5 font-normal text-tf-app-subtle">·</span>
            <span className="font-black text-tf-app-fg">{pastTotal}</span> résultats
            {isCdm ? (
              <>
                <span className="mx-1.5 font-normal text-tf-app-subtle">·</span>
                <span className="font-bold text-tf-app-fg">Calendrier CDM jusqu’au 31 juillet</span>
              </>
            ) : null}
            {competitionId !== 'all' ? (
              <>
                <span className="mx-1.5 font-normal text-tf-app-subtle">·</span>
                <span className="font-bold text-tf-app-fg">
                  {competitions.find((c) => c.id === competitionId)?.shortName ?? ''}
                </span>
              </>
            ) : null}
            {supporterTintActive && team ? (
              <span className="mt-1 block text-xs font-bold sm:mt-0 sm:ml-2 sm:inline">
                ({team.shortName})
              </span>
            ) : null}
          </p>
          {/* UI orientée utilisateur: filtres directs uniquement (sans détails techniques API). */}
        </div>
      </header>

      {liveFeatured.length > 0 ? (
        <section aria-labelledby="cal-live-heading" className="space-y-tf-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <h2 id="cal-live-heading" className={cn(sectionHeading, 'tracking-wider')}>
                {isMultiplex ? 'Multiplex — en direct' : 'En direct'}
              </h2>
              {isMultiplex ? (
                <p
                  className={cn(
                    'text-xs font-semibold leading-snug sm:text-sm',
                    L ? 'text-tf-grey' : 'text-sky-100/90',
                  )}
                >
                  <span className="md:hidden">
                    Fais défiler la liste horizontale pour voir les {liveFeatured.length} matchs, puis touche un
                    tribune pour entrer.
                  </span>
                  <span className="hidden md:inline">
                    {liveFeatured.length} rencontres en cours — choisis un match pour ouvrir le tribune live.
                  </span>
                </p>
              ) : null}
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                L ? 'bg-tf-grey-pastel/40 text-tf-dark' : 'bg-white/[0.1] text-sky-100/90 ring-1 ring-white/15',
              )}
            >
              {liveFeatured.length} live{liveFeatured.length > 1 ? 's' : ''}
            </span>
          </div>
          <HubEncartTopAccent appearance={L ? 'light' : 'dark'} preset="live" />
          {isMultiplex ? (
            <div
              className="relative -mx-1 md:hidden"
              role="region"
              aria-label="Liste des matchs en direct, défilement horizontal"
            >
              <div className="flex gap-3 overflow-x-auto px-1 pb-2 pt-0.5 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                {liveFeatured.map((m) => (
                  <div key={m.id} className="w-[min(86vw,19.5rem)] max-w-full shrink-0 snap-center">
                    <HubRailRowLive match={m} className="h-full min-h-[4.5rem]" />
                  </div>
                ))}
              </div>
              <p
                className={cn(
                  'pointer-events-none mt-1 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.2em]',
                  L ? 'text-tf-grey/90' : 'text-sky-200/75',
                )}
                aria-hidden
              >
                <span>←</span>
                <span>Glisser pour tous les matchs</span>
                <span>→</span>
              </p>
            </div>
          ) : null}
          <div className={cn('flex flex-wrap gap-tf-4', isMultiplex ? 'hidden md:flex' : 'flex')}>
            {liveFeatured.map((m) => (
              <div
                key={m.id}
                className="flex min-w-0 w-full grow basis-full sm:basis-[calc((100%-var(--tf-space-4))/2)] xl:basis-[calc((100%-3rem)/4)]"
              >
                <HubMatchStrip match={m} className="max-w-full grow" />
              </div>
            ))}
          </div>
        </section>
      ) : upcomingSpotlightMatches.length > 0 ? (
        <section aria-labelledby="cal-featured-heading" className="space-y-tf-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="cal-featured-heading" className={sectionHeading}>
              À la une
            </h2>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                L ? 'bg-tf-grey-pastel/40 text-tf-dark' : 'bg-white/[0.1] text-sky-100/90 ring-1 ring-white/15',
              )}
            >
              {upcomingSpotlightMatches.length} match{upcomingSpotlightMatches.length > 1 ? 's' : ''}
            </span>
          </div>
          <HubEncartTopAccent appearance={L ? 'light' : 'dark'} preset="upcoming" />
          <div className="grid grid-cols-2 gap-tf-3 sm:gap-tf-4 xl:grid-cols-3 2xl:grid-cols-4">
            {upcomingSpotlightMatches.map((m) => (
              <MatchSpotlightCard key={m.id} match={m} density="grid" className="h-full min-w-0" />
            ))}
          </div>
        </section>
      ) : null}

      <div className="sticky top-0 z-10 -mx-1 mb-tf-2 sm:-mx-0 sm:mb-tf-3" aria-label="Filtres et vue calendrier">
        <div
          className={cn(
            'overflow-hidden rounded-tf-2xl border shadow-tf-elev-2 backdrop-blur-md',
            L ? 'border-tf-grey-pastel/50' : 'border-white/12',
          )}
        >
          <div
            className={cn(
              'space-y-2 p-2.5 sm:space-y-2.5 sm:p-3',
              L ? 'bg-[color:color-mix(in_srgb,var(--tf-c60-base)_94%,white)]' : 'bg-[#071e33]/92',
            )}
          >
            <div className="flex items-center gap-2">
              <div
                role="tablist"
                aria-label="Affichage"
                className={cn('flex min-w-0 flex-1 rounded-xl p-1', L ? 'bg-black/[0.04]' : 'bg-white/[0.07]')}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={primaryTab === 'upcoming'}
                  onClick={() => setPrimaryTab('upcoming')}
                  className={tabBtn(primaryTab === 'upcoming')}
                >
                  À venir{upcomingTotal > 0 ? ` · ${upcomingTotal}` : ''}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={primaryTab === 'past'}
                  onClick={() => setPrimaryTab('past')}
                  className={tabBtn(primaryTab === 'past')}
                >
                  Résultats{pastTotal > 0 ? ` · ${pastTotal}` : ''}
                </button>
              </div>
              <div
                className="hidden max-w-[40%] items-center gap-1.5 overflow-x-auto pr-1 md:flex [scrollbar-width:thin]"
                role="group"
                aria-label="Filtres ligue rapides"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCompetitionId('all')
                    setDayKey('all')
                  }}
                  className={cn(
                    'shrink-0 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide transition',
                    competitionId === 'all'
                      ? L
                        ? 'border-tf-dark/35 bg-tf-dark text-white'
                        : 'border-sky-300/45 bg-sky-500/20 text-white'
                      : L
                        ? 'border-tf-grey-pastel/70 bg-white text-tf-dark hover:border-tf-dark/30'
                        : 'border-white/20 bg-white/[0.08] text-sky-100 hover:bg-white/[0.14]',
                  )}
                >
                  Toutes
                </button>
                {quickCompetitionChips.map((c) => {
                  const selected = competitionId === c.id
                  return (
                    <button
                      key={`quick-${c.id}`}
                      type="button"
                      onClick={() => {
                        setCompetitionId(c.id)
                        setDayKey('all')
                      }}
                      className={cn(
                        'shrink-0 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide transition',
                        selected
                          ? L
                            ? 'border-tf-dark/35 bg-tf-dark text-white'
                            : 'border-sky-300/45 bg-sky-500/20 text-white'
                          : L
                            ? 'border-tf-grey-pastel/70 bg-white text-tf-dark hover:border-tf-dark/30'
                            : 'border-white/20 bg-white/[0.08] text-sky-100 hover:bg-white/[0.14]',
                      )}
                      aria-pressed={selected}
                    >
                      {c.shortName}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className={cn(
                  'shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition',
                  L
                    ? 'border-tf-grey-pastel/70 bg-white text-tf-dark hover:border-tf-dark/30'
                    : 'border-white/20 bg-white/[0.08] text-sky-100 hover:bg-white/[0.14]',
                )}
              >
                Filtres {filtersOpen ? '−' : '+'}
              </button>
            </div>
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 md:hidden [scrollbar-width:thin]"
              role="group"
              aria-label="Filtrer par ligue"
            >
              <button
                type="button"
                onClick={() => {
                  setCompetitionId('all')
                  setDayKey('all')
                }}
                className={cn(
                  'shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition',
                  competitionId === 'all'
                    ? L
                      ? 'border-tf-dark/35 bg-tf-dark text-white'
                      : 'border-sky-300/45 bg-sky-500/20 text-white'
                    : L
                      ? 'border-tf-grey-pastel/70 bg-white text-tf-dark'
                      : 'border-white/20 bg-white/[0.08] text-sky-100',
                )}
              >
                Toutes ligues
              </button>
              {competitions.map((c) => {
                const selected = competitionId === c.id
                const th = themeForCompetition(c.id)
                return (
                  <button
                    key={`mobile-league-${c.id}`}
                    type="button"
                    onClick={() => {
                      setCompetitionId(c.id)
                      setDayKey('all')
                    }}
                    className={cn(
                      'shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition',
                      selected
                        ? 'text-white ring-2 ring-white/40'
                        : L
                          ? 'border-tf-grey-pastel/70 bg-white text-tf-dark'
                          : 'border-white/20 bg-white/[0.08] text-sky-100',
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
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className={cn(L ? 'text-tf-grey' : 'text-sky-200/90')}>
                {competitionId === 'all'
                  ? 'Toutes ligues'
                  : `Ligue: ${competitions.find((c) => c.id === competitionId)?.shortName ?? '—'}`}
              </span>
              <span className={cn(L ? 'text-tf-grey' : 'text-sky-200/90')}>
                {dayKey === 'all' ? 'Tous les jours' : dayChips.find((d) => d.key === dayKey)?.label}
              </span>
            </div>
            {filtersOpen ? (
              <>
                <div className="space-y-tf-2">
                  <p
                    className={cn(
                      'text-[10px] font-black uppercase tracking-[0.16em]',
                      L ? 'text-tf-grey' : 'text-tf-app-muted',
                    )}
                  >
                    Ligue
                  </p>
                  <div
                    className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]"
                    role="group"
                    aria-label="Filtrer par ligue"
                  >
                    {leagueChipRow}
                  </div>
                </div>
                <div className="space-y-tf-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-[0.16em]',
                        L ? 'text-tf-grey' : 'text-tf-app-muted',
                      )}
                    >
                      Jour
                    </p>
                    <span className={cn('text-[10px] font-bold', L ? 'text-tf-grey' : 'text-sky-200/90')}>
                      {dayKey === 'all' ? 'Tous' : dayChips.find((d) => d.key === dayKey)?.label}
                    </span>
                  </div>
                  <div
                    className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]"
                    role="group"
                    aria-label="Filtrer par jour"
                  >
                    {dayChipRow}
                  </div>
                </div>
              </>
            ) : null}
          </div>
          {/* Fondu utile surtout quand le panneau détaillé est ouvert. */}
          {filtersOpen ? (
            <div
              aria-hidden
              className={cn(
                'pointer-events-none h-4 w-full bg-gradient-to-b sm:h-6',
                L
                  ? 'from-[color:color-mix(in_srgb,var(--tf-c60-base)_94%,white)] via-[color:color-mix(in_srgb,var(--tf-c60-base)_88%,white)]/55 to-transparent'
                  : 'from-[#071e33]/92 via-[#071e33]/55 to-transparent',
              )}
            />
          ) : null}
        </div>
      </div>

      <section aria-label="Liste des matchs par jour" className="min-w-0">
        {primaryTab === 'upcoming' &&
        visibleUpcoming.length === 0 &&
        visiblePast.length === 0 &&
        liveFeatured.length === 0 &&
        upcomingSpotlightMatches.length === 0 ? (
          <Card
            className={cn('p-tf-8 text-center', !L && 'border-white/12 bg-white/[0.04]')}
            elevation="soft"
          >
            <p className="text-tf-md font-bold text-tf-app-fg">Aucun match à venir</p>
            <p className="mt-tf-2 text-tf-sm font-medium text-tf-app-muted">
              {isCdm
                ? 'Aucune rencontre CDM chargée depuis SportMonks pour la période (jusqu’au 31 juillet). Vérifie la clé API Coupe du monde.'
                : `Change de ligue ou de jour${pastTotal > 0 ? ', ou passe à l’onglet Résultats.' : '.'}`}
            </p>
            {pastTotal > 0 ? (
              <button
                type="button"
                onClick={() => setPrimaryTab('past')}
                className={cn(
                  'mt-tf-4 text-sm font-black underline underline-offset-2',
                  L ? 'text-tf-electric-deep' : 'text-sky-300',
                )}
              >
                Voir {pastTotal} résultat{pastTotal > 1 ? 's' : ''}
              </button>
            ) : null}
            <Link
              to="/"
              className={cn(
                'mt-tf-3 block text-tf-sm font-bold',
                L ? 'text-tf-grey' : 'text-tf-app-muted',
              )}
            >
              ← Accueil
            </Link>
          </Card>
        ) : null}

        {primaryTab === 'past' && visiblePast.length === 0 ? (
          <Card
            className={cn('p-tf-8 text-center', !L && 'border-white/12 bg-white/[0.04]')}
            elevation="soft"
          >
            <p className="text-tf-md font-bold text-tf-app-fg">Aucun résultat sur ce filtre</p>
            <p className="mt-tf-2 text-tf-sm font-medium text-tf-app-muted">
              Essaie « Tous » pour les jours, ou une autre ligue.
            </p>
            {upcomingTotal > 0 ? (
              <button
                type="button"
                onClick={() => setPrimaryTab('upcoming')}
                className={cn(
                  'mt-tf-4 text-sm font-black underline underline-offset-2',
                  L ? 'text-tf-electric-deep' : 'text-sky-300',
                )}
              >
                Voir les matchs à venir
              </button>
            ) : null}
          </Card>
        ) : null}

        {primaryTab === 'upcoming' &&
        !(
          visibleUpcoming.length === 0 &&
          visiblePast.length === 0 &&
          liveFeatured.length === 0 &&
          upcomingSpotlightMatches.length === 0
        ) ? (
          <div className="space-y-tf-6">
            {pastTotal > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPrimaryTab('past')}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition',
                    L
                      ? 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:border-tf-dark/30'
                      : 'border-white/20 bg-white/[0.08] text-tf-app-fg hover:bg-white/[0.12]',
                  )}
                >
                  Résultats{pastTotal > 0 ? ` (${pastTotal})` : ''} →
                </button>
              </div>
            ) : null}
            {visibleUpcoming.length > 0 ? (
              <div className="space-y-tf-6" aria-labelledby="cal-upcoming-heading">
                <h2 id="cal-upcoming-heading" className={cn(sectionHeading, 'border-b pb-tf-2', L ? 'border-tf-grey-pastel/40' : 'border-white/15')}>
                  À venir
                </h2>
                <div className="space-y-tf-6">
                  {visibleUpcoming.map((g) => (
                    <div key={`up-${g.key}`}>
                      <h3
                        className={cn(
                          'mb-tf-3 text-sm font-black uppercase tracking-wide text-tf-app-fg',
                        )}
                      >
                        {g.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-tf-3 md:gap-tf-5">
                        {g.matches.map((m) => (
                          <MatchSpotlightCard key={m.id} match={m} density="grid" className="h-full min-w-0" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isMultiplex ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-rose-400/35 bg-rose-500/[0.06] p-4 text-center">
                <p className={cn('text-sm font-bold', L ? 'text-tf-dark' : 'text-tf-app-fg')}>
                  Multiplex en cours — tous les lives sont en haut de page
                </p>
                <p className={cn('text-xs font-medium', L ? 'text-tf-grey' : 'text-tf-app-muted')}>
                  Remonte à la section « Multiplex — en direct » et fais défiler horizontalement pour choisir un
                  match.
                </p>
              </div>
            ) : liveFeatured.length > 0 || upcomingSpotlightMatches.length > 0 ? (
              <p className={cn('text-center text-sm font-medium', L ? 'text-tf-grey' : 'text-tf-app-muted')}>
                Prochains matchs : voir les encarts live ou à la une ci-dessus.
              </p>
            ) : null}
          </div>
        ) : null}

        {primaryTab === 'past' && visiblePast.length > 0 ? (
          <div ref={resultsSectionRef} className="space-y-tf-6 scroll-mt-24" aria-labelledby="cal-past-heading">
            {upcomingTotal > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPrimaryTab('upcoming')}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition',
                    L
                      ? 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:border-tf-dark/30'
                      : 'border-white/20 bg-white/[0.08] text-tf-app-fg hover:bg-white/[0.12]',
                  )}
                >
                  ← À venir{upcomingTotal > 0 ? ` (${upcomingTotal})` : ''}
                </button>
              </div>
            ) : null}
            <h2
              id="cal-past-heading"
              className={cn(sectionHeading, 'border-b pb-tf-2', L ? 'border-tf-grey-pastel/40' : 'border-white/15')}
            >
              Résultats
            </h2>
            <div className="w-full min-w-0 space-y-tf-6">
              {visiblePast.map((g) => (
                <div key={`past-${g.key}`}>
                  <h3 className="mb-tf-3 text-sm font-black uppercase tracking-wide text-tf-app-fg">{g.label}</h3>
                  <div className="grid grid-cols-2 gap-tf-3 sm:gap-tf-4 xl:grid-cols-3 2xl:grid-cols-4">
                    {g.matches.map((m) => (
                      <MatchSpotlightCard key={m.id} match={m} density="grid" className="h-full min-w-0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
