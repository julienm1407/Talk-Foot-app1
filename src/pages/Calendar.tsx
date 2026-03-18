import { useMemo, useState } from 'react'
import { upcomingMatches } from '../data/matches'
import { MatchCard } from '../components/match/MatchCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { themeForCompetition } from '../data/competitionThemes'

export function CalendarPage() {
  const now = Date.now()

  const sorted = useMemo(() => {
    return [...upcomingMatches]
      .filter((m) => m.status !== 'finished')
      .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
  }, [])

  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; shortName: string }>()
    for (const m of sorted) map.set(m.competition.id, m.competition)
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [sorted])

  const [competitionId, setCompetitionId] = useState<string>('all')
  const [dayKey, setDayKey] = useState<string>('all')

  const activeTheme = useMemo(() => {
    return competitionId === 'all' ? null : themeForCompetition(competitionId)
  }, [competitionId])

  const featured = useMemo(() => {
    const nextUpcoming = sorted.find(
      (m) => m.status === 'upcoming' && +new Date(m.kickoffAt) >= now - 60_000,
    )
    return nextUpcoming ?? sorted[0]
  }, [sorted, now])

  const filtered = useMemo(() => {
    const base =
      competitionId === 'all'
        ? sorted
        : sorted.filter((m) => m.competition.id === competitionId)

    // Keep the featured match up top only (no duplicate in list).
    return base.filter((m) => !featured || m.id !== featured.id)
  }, [competitionId, featured, sorted])

  const grouped = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
    })

    const groups = new Map<
      string,
      { ts: number; label: string; matches: typeof filtered }
    >()

    for (const m of filtered) {
      const d = new Date(m.kickoffAt)
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`

      const existing = groups.get(key)
      if (existing) {
        existing.matches.push(m)
        continue
      }

      groups.set(key, { ts: day.getTime(), label: fmt.format(d), matches: [m] })
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[1].ts - b[1].ts)
      .map(([key, v]) => ({ key, label: v.label, matches: v.matches }))
  }, [filtered])

  const visible = useMemo(() => {
    if (dayKey === 'all') return grouped
    return grouped.filter((g) => g.key === dayKey)
  }, [dayKey, grouped])

  const totalVisible = useMemo(() => {
    return visible.reduce((acc, g) => acc + g.matches.length, 0)
  }, [visible])

  const dayChips = useMemo(() => {
    const chips = grouped.slice(0, 7).map((g) => ({
      key: g.key,
      label: g.label,
      count: g.matches.length,
    }))
    return chips
  }, [grouped])

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
              CALENDRIER
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Matchs à venir
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-700/70">
              Clique sur une ligue pour filtrer.
            </p>
          </div>
        </div>

        <div
          className="mt-3 rounded-3xl border bg-white/70 p-4"
          style={{
            borderColor: activeTheme
              ? `color-mix(in srgb, ${activeTheme.accent} 55%, rgba(148,163,184,0.6))`
              : 'rgba(148,163,184,0.55)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">
              Résumé
            </div>
            <div className="text-sm font-semibold text-slate-700/70">
              {competitionId === 'all'
                ? 'Toutes compétitions'
                : competitions.find((c) => c.id === competitionId)?.name ??
                  'Compétition'}{' '}
              • {totalVisible} match(s)
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar
              value={
                totalVisible === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round((totalVisible / Math.max(1, sorted.length)) * 100),
                    )
              }
              tone={
                !activeTheme
                  ? 'slate'
                  : activeTheme.id === 'epl'
                    ? 'violet'
                    : activeTheme.id === 'laliga'
                      ? 'amber'
                      : activeTheme.id === 'bund'
                        ? 'amber'
                        : activeTheme.id === 'serie-a'
                          ? 'blue'
                          : 'blue'
              }
            />
          </div>
        </div>

        {featured ? (
          <div className="mt-4">
            <div className="mb-2 flex items-end justify-between gap-3 px-1">
              <div>
                <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/65">
                  ÉVÉNEMENT FORT
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">
                  Prochain match à ne pas rater
                </div>
              </div>
            </div>
            <div
              className="rounded-3xl"
              style={{
                boxShadow: activeTheme
                  ? `0 0 0 2px color-mix(in srgb, ${activeTheme.accent} 18%, transparent)`
                  : undefined,
              }}
            >
              <MatchCard match={featured} />
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white/70 p-2">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button
            variant={competitionId === 'all' ? 'primary' : 'soft'}
            className="h-10 rounded-2xl px-4"
            onClick={() => {
              setCompetitionId('all')
              setDayKey('all')
            }}
            aria-pressed={competitionId === 'all'}
          >
            Toutes
          </Button>
          {competitions.map((c) => (
            (() => {
              const th = themeForCompetition(c.id)
              const selected = competitionId === c.id
              return (
            <Button
              key={c.id}
              variant={selected ? 'soft' : 'soft'}
              className={
                `h-10 rounded-2xl px-4 ${th && !selected ? `${th.labelBg} ${th.labelText} border border-slate-200/70` : ''}`
              }
              style={
                th && selected
                  ? ({
                      background: `linear-gradient(135deg, ${th.accent}, ${th.accent2})`,
                      borderColor: 'transparent',
                      color: '#fff',
                    } as React.CSSProperties)
                  : undefined
              }
              onClick={() => {
                setCompetitionId(c.id)
                setDayKey('all')
              }}
              aria-pressed={competitionId === c.id}
            >
              {c.name}
            </Button>
              )
            })()
          ))}
          </div>
        </div>

        <div className="mt-3 rounded-3xl border border-slate-200/80 bg-white/70 p-2">
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <div className="text-xs font-black tracking-[0.14em] text-slate-700/70">
              JOURS
            </div>
            <Button
              variant={dayKey === 'all' ? 'primary' : 'ghost'}
              className="h-8 rounded-2xl px-3"
              onClick={() => setDayKey('all')}
              aria-pressed={dayKey === 'all'}
            >
              Tout
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {dayChips.map((d) => (
              <Button
                key={d.key}
                variant={dayKey === d.key ? 'primary' : 'soft'}
                className="h-9 rounded-2xl px-4"
                onClick={() => setDayKey(d.key)}
                aria-pressed={dayKey === d.key}
                style={
                  dayKey === d.key && activeTheme
                    ? ({
                        background: `linear-gradient(135deg, ${activeTheme.accent}, ${activeTheme.accent2})`,
                        borderColor: 'transparent',
                        color: '#fff',
                      } as React.CSSProperties)
                    : activeTheme
                      ? ({
                          borderColor: `color-mix(in srgb, ${activeTheme.accent} 16%, rgba(148,163,184,0.6))`,
                        } as React.CSSProperties)
                      : undefined
                }
              >
                {d.label} · {d.count}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {visible.map((g) => (
          <Card key={g.key} className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-900">
                {g.label}
              </div>
              <div className="text-xs font-bold text-slate-700/70">
                {competitionId === 'all'
                  ? 'Toutes compétitions'
                  : competitions.find((c) => c.id === competitionId)?.name ??
                    'Compétition'}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {g.matches.map((m) => (
                <MatchCard key={m.id} match={m} compact />
              ))}
            </div>
          </Card>
        ))}

        {visible.length === 0 ? (
          <Card className="p-5 text-center">
            <div className="text-sm font-extrabold text-slate-900">
              Aucun match à venir pour cette ligue.
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-700/70">
              Essaie une autre compétition.
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

