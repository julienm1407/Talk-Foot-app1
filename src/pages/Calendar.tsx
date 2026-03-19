import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { MatchCard } from '../components/match/MatchCard'
import { Card } from '../components/ui/Card'
import { themeForCompetition } from '../data/competitionThemes'
import { formatKickoff } from '../utils/time'
import { ClubCrest } from '../components/brand/ClubCrest'
import { cn } from '../utils/cn'

export function CalendarPage() {
  const now = Date.now()

  const { matches, loading } = useMatches()
  const sorted = useMemo(() => {
    return [...matches]
      .filter((m) => m.status !== 'finished')
      .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
  }, [matches])

  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; shortName: string }>()
    for (const m of sorted) map.set(m.competition.id, m.competition)
    return Array.from(map.values()).sort((a, b) => a.shortName.localeCompare(b.shortName))
  }, [sorted])

  const [competitionId, setCompetitionId] = useState<string>('all')
  const [dayKey, setDayKey] = useState<string>('all')

  const activeTheme = useMemo(
    () => (competitionId === 'all' ? null : themeForCompetition(competitionId)),
    [competitionId],
  )

  const featured = useMemo(() => {
    const pool =
      competitionId === 'all'
        ? sorted
        : sorted.filter((m) => m.competition.id === competitionId)
    const live = pool.find((m) => m.status === 'live')
    const next = pool.find(
      (m) => m.status === 'upcoming' && +new Date(m.kickoffAt) >= now - 60_000,
    ) ?? pool.filter((m) => m.status === 'upcoming')[0]
    return live ?? next
  }, [competitionId, sorted, now])

  const filtered = useMemo(() => {
    const base =
      competitionId === 'all'
        ? sorted
        : sorted.filter((m) => m.competition.id === competitionId)
    return featured ? base.filter((m) => m.id !== featured.id) : base
  }, [competitionId, featured, sorted])

  const grouped = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const groups = new Map<string, { ts: number; label: string; matches: typeof filtered }>()

    for (const m of filtered) {
      const d = new Date(m.kickoffAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    const shortFmt = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    })

    return grouped.slice(0, 8).map((g) => {
      const label =
        g.key === todayKey
          ? "Aujourd'hui"
          : g.key === tomorrowKey
            ? 'Demain'
            : shortFmt.format(new Date(g.key))
      return { key: g.key, label, count: g.matches.length }
    })
  }, [grouped])

  const totalCount = useMemo(
    () => visible.reduce((acc, g) => acc + g.matches.length, 0) + (featured ? 1 : 0),
    [visible, featured],
  )

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* En-tête clair */}
      <header className="space-y-2 pb-2">
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
          Calendrier
        </h1>
        <p className="text-sm font-medium text-tf-grey">
          {totalCount} match{totalCount > 1 ? 's' : ''} à venir
          {competitionId !== 'all' && (
            <> • {competitions.find((c) => c.id === competitionId)?.shortName ?? ''}</>
          )}
        </p>
      </header>

      {/* Match en direct ou prochain — priorité visuelle */}
      {featured && (
        <section aria-label="Match à la une">
          <Link
            to={`/channel/${featured.id}`}
            className="block rounded-2xl outline-none ring-2 ring-transparent transition-all focus-visible:ring-tf-grey/40 hover:opacity-95"
            aria-label={`Rejoindre ${featured.home.shortName} vs ${featured.away.shortName}`}
          >
            <Card
              className="overflow-hidden p-0"
              elevation="soft"
              style={
                activeTheme && competitionId === featured.competition.id
                  ? { borderColor: `${activeTheme.accent}40` }
                  : undefined
              }
            >
              <div
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                style={
                  themeForCompetition(featured.competition.id)
                    ? {
                        background: `linear-gradient(135deg, ${themeForCompetition(featured.competition.id)!.accent}08, ${themeForCompetition(featured.competition.id)!.accent2}08)`,
                      }
                    : undefined
                }
              >
                <div className="flex shrink-0 items-center gap-3">
                  <ClubCrest
                    id={featured.home.id}
                    shortName={featured.home.shortName}
                    colors={featured.home.colors}
                    size={48}
                  />
                  <div className="text-center">
                    {featured.status === 'live' ? (
                      <>
                        <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white">
                          EN DIRECT
                        </span>
                        {featured.score && (
                          <div className="mt-1 font-display text-lg font-black text-tf-dark">
                            {featured.score.home} – {featured.score.away}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-bold text-tf-grey">
                        {formatKickoff(featured.kickoffAt)}
                      </span>
                    )}
                    <div className="mt-1 text-[11px] font-semibold text-tf-grey">
                      {featured.competition.shortName}
                    </div>
                  </div>
                  <ClubCrest
                    id={featured.away.id}
                    shortName={featured.away.shortName}
                    colors={featured.away.colors}
                    size={48}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-black text-tf-dark sm:text-2xl">
                    {featured.home.shortName} – {featured.away.shortName}
                  </div>
                  <div className="mt-1 text-sm font-medium text-tf-grey">
                    {new Intl.DateTimeFormat('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(featured.kickoffAt))}
                  </div>
                  <div className="mt-2 text-sm font-bold text-tf-dark">
                    {featured.status === 'live' ? 'Rejoindre le live' : "Voir l'avant-match"} →
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* Filtres — compacts et accessibles */}
      <section aria-label="Filtrer les matchs" className="space-y-5">
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-tf-grey">
            Ligue
          </h2>
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Sélectionner une compétition"
          >
            <button
              type="button"
              onClick={() => {
                setCompetitionId('all')
                setDayKey('all')
              }}
              className={cn(
                'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-tf-grey/40 focus:ring-offset-2',
                competitionId === 'all'
                  ? 'bg-tf-dark text-white'
                  : 'bg-tf-grey-pastel/40 text-tf-dark hover:bg-tf-grey-pastel/60',
              )}
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
                    'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                    selected
                      ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-tf-grey-pastel/40 shadow-lg'
                      : 'opacity-50 hover:opacity-70',
                    th ? 'text-white focus:ring-white/60' : 'bg-tf-dark text-white focus:ring-tf-grey/40',
                  )}
                  style={
                    th
                      ? {
                          background: `linear-gradient(135deg, ${th.accent}, ${th.accent2})`,
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
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-tf-grey">
              Jour
            </h2>
            <span className="text-xs font-medium text-tf-grey">
              {dayKey === 'all' ? 'Tous les jours' : dayChips.find((d) => d.key === dayKey)?.label}
            </span>
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Sélectionner un jour"
          >
            <button
              type="button"
              onClick={() => setDayKey('all')}
              className={cn(
                'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-tf-grey/40 focus:ring-offset-2',
                dayKey === 'all'
                  ? 'bg-tf-dark text-white'
                  : 'border border-tf-grey-pastel/60 bg-tf-white text-tf-dark hover:bg-tf-grey-pastel/30',
              )}
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
                  className={cn(
                    'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-tf-grey/40 focus:ring-offset-2',
                    selected
                      ? 'bg-tf-dark text-white'
                      : 'border border-tf-grey-pastel/60 bg-tf-white text-tf-dark hover:bg-tf-grey-pastel/30',
                  )}
                  aria-pressed={selected}
                >
                  {d.label}
                  <span className="ml-1.5 font-normal opacity-75">({d.count})</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Liste des matchs par jour */}
      <section aria-label="Liste des matchs">
        {visible.length === 0 ? (
          <Card className="p-8 text-center" elevation="soft">
            <p className="text-base font-bold text-tf-dark">
              Aucun match à afficher
            </p>
            <p className="mt-1 text-sm font-medium text-tf-grey">
              {featured
                ? 'Le match à la une est au-dessus.'
                : 'Choisis une autre ligue ou un autre jour.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {visible.map((g) => (
              <div key={g.key}>
                <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-tf-grey">
                  {g.label}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {g.matches.map((m) => (
                    <MatchCard key={m.id} match={m} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
