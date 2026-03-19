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

  // Scroller uniquement le carrousel horizontal, pas la page (évite de ramener l'utilisateur)
  useEffect(() => {
    const container = listRef.current
    const el = itemRefs.current[index]
    if (!container || !el) return
    const targetScroll = el.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2)
    const clamped = Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth))
    container.scrollTo({ left: clamped, behavior: 'smooth' })
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
            {title}
          </h2>
          <p className="text-sm font-medium text-tf-grey">
            {subtitle || 'Matchs en direct et à venir — clique pour accéder au live'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + sorted.length) % sorted.length)}
            className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/90 px-3 py-2 text-sm font-black text-tf-dark transition hover:bg-tf-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/30"
            aria-label="Match précédent"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % sorted.length)}
            className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/90 px-3 py-2 text-sm font-black text-tf-dark transition hover:bg-tf-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/30"
            aria-label="Match suivant"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        data-no-swipe="true"
        className="-mx-1 flex gap-5 overflow-x-auto px-1 py-6 pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory"
        aria-label="Carrousel des matchs"
      >
        {viewMatches.map((m, i) => (
          <div
            key={m.id}
            ref={(node) => {
              itemRefs.current[i] = node
            }}
            className="flex shrink-0 snap-start flex-col items-center py-4 px-2"
          >
            <div className="flex w-full min-w-[240px] max-w-[320px] sm:min-w-[280px] lg:min-w-[300px]">
              <MatchCard match={m} />
            </div>
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

