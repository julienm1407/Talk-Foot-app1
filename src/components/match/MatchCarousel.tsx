import { useEffect, useMemo, useRef, useState } from 'react'
import type { Match } from '../../types/match'
import { MatchCard } from './MatchCard'
import { cn } from '../../utils/cn'
import { themeForCompetition } from '../../data/competitionThemes'

export function MatchCarousel({
  matches,
  title,
  subtitle,
}: {
  matches: Match[]
  title: string
  subtitle: string
}) {
  const sorted = useMemo(() => {
    const ms = [...matches]
    ms.sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    // put live first
    return ms.sort(
      (a, b) =>
        (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0),
    )
  }, [matches])

  const [clockTick, setClockTick] = useState(0)
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  // Simulate time passing for live matches (fast-forward for demo)
  useEffect(() => {
    const id = window.setInterval(() => setClockTick((t) => t + 1), 5000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (sorted.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % sorted.length)
    }, 3800)
    return () => window.clearInterval(id)
  }, [sorted.length])

  useEffect(() => {
    const el = itemRefs.current[index]
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [index])

  const viewMatches = useMemo(() => {
    return sorted.map((m) => {
      if (m.status !== 'live') return m
      const base = m.minute ?? 1
      return { ...m, minute: Math.min(99, base + clockTick) }
    })
  }, [sorted, clockTick])

  const activeTheme = useMemo(() => {
    const m = viewMatches[index]
    return m ? themeForCompetition(m.competition.id) : null
  }, [index, viewMatches])

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-black tracking-wide text-slate-600">
            MATCHS
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-700 sm:text-base">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + sorted.length) % sorted.length)}
            className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-black text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
            aria-label="Match précédent"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % sorted.length)}
            className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-black text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
            aria-label="Match suivant"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        data-no-swipe="true"
        className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory"
        aria-label="Carrousel des matchs"
      >
        {viewMatches.map((m, i) => (
          <div
            key={m.id}
            ref={(node) => {
              itemRefs.current[i] = node
            }}
            className="min-w-[320px] max-w-[420px] flex-1 snap-start sm:min-w-[420px]"
          >
            <MatchCard match={m} elevation="none" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {viewMatches.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              'h-2.5 w-2.5 rounded-full border transition',
              i === index
                ? 'border-slate-300'
                : 'border-slate-300 bg-white',
            )}
            style={
              i === index && activeTheme
                ? { background: activeTheme.accent }
                : i === index
                  ? { background: '#0a3dff' }
                  : undefined
            }
            aria-label={`Aller au match ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

