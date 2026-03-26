import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation, LiveMirrorForCard } from '../../types/liveSimulation'
import { HubMatchStrip } from './HubMatchEncart'
import { cn } from '../../utils/cn'
import { themeForCompetition } from '../../data/competitionThemes'

export type CarouselLiveMirror = LiveEncartSimulation & { matchId: string }

function mirrorForCard(
  liveMirror: CarouselLiveMirror | undefined,
  m: Match,
): LiveMirrorForCard | undefined {
  if (!liveMirror || m.id !== liveMirror.matchId || m.status !== 'live') return undefined
  return {
    active: liveMirror.active,
    minute: liveMirror.minute,
    score: liveMirror.score,
    bumpSide: liveMirror.bumpSide,
    rim: liveMirror.rim,
    burst: liveMirror.burst,
    toast: liveMirror.toast,
  }
}

function DesktopMatchGrid({
  matches,
  liveMirror,
}: {
  matches: Match[]
  liveMirror?: CarouselLiveMirror
}) {
  if (matches.length === 0) return null

  const useMoreTile = matches.length > 6
  const count = useMoreTile ? 5 : Math.min(6, matches.length)
  const slice = matches.slice(0, count)
  const extra = matches.length - count

  const nodes: ReactNode[] = slice.map((m) => (
    <div key={m.id} className="min-w-0">
      <HubMatchStrip match={m} liveMirror={mirrorForCard(liveMirror, m)} />
    </div>
  ))

  if (extra > 0) {
    nodes.push(
      <Link
        key="more-matches"
        to="/matches"
        className="flex min-h-[min(220px,28vw)] min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-tf-electric/25 bg-gradient-to-br from-tf-ice/50 to-white p-4 text-center transition hover:border-tf-electric/45"
      >
        <span className="font-display text-lg font-black text-tf-dark">+{extra}</span>
        <span className="mt-1 text-xs font-bold text-tf-grey">Autres matchs sur le hub</span>
      </Link>,
    )
  }

  const pad = (2 - (nodes.length % 2)) % 2
  for (let i = 0; i < pad; i++) {
    nodes.push(
      <Link
        key={`pad-${i}`}
        to="/matches"
        className="flex min-h-[200px] min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-tf-grey-pastel/70 bg-tf-grey-pastel/12 p-4 text-center text-xs font-black uppercase tracking-wide text-tf-grey transition hover:border-tf-electric/35 hover:text-tf-dark"
      >
        Hub matchs →
      </Link>,
    )
  }

  return (
    <div className="hidden lg:block" aria-label="Matchs à l’affiche">
      <div className="grid grid-cols-2 gap-5 xl:gap-6">{nodes}</div>
    </div>
  )
}

export function MatchCarousel({
  matches,
  title,
  subtitle,
  eyebrow,
  titleId,
  liveMirror,
}: {
  matches: Match[]
  title: string
  subtitle: string
  eyebrow?: string
  titleId?: string
  /** Synchronise la carte du match « hero » avec l’encart live accueil. */
  liveMirror?: CarouselLiveMirror
}) {
  const sorted = useMemo(() => {
    const ms = [...matches]
    ms.sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    return ms.sort(
      (a, b) =>
        (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0),
    )
  }, [matches])

  const [clockTick, setClockTick] = useState(0)
  const [index, setIndex] = useState(0)
  const [desktopLayout, setDesktopLayout] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setDesktopLayout(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setClockTick((t) => t + 1), 5000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (desktopLayout || sorted.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % sorted.length)
    }, 3800)
    return () => window.clearInterval(id)
  }, [sorted.length, desktopLayout])

  useEffect(() => {
    if (desktopLayout) return
    const container = listRef.current
    const el = itemRefs.current[index]
    if (!container || !el) return
    const targetScroll = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
    const clamped = Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth))
    container.scrollTo({ left: clamped, behavior: 'smooth' })
  }, [index, desktopLayout])

  const viewMatches = useMemo(() => {
    return sorted.map((m) => {
      if (m.status !== 'live') return m
      if (liveMirror && m.id === liveMirror.matchId) return m
      const base = m.minute ?? 1
      return { ...m, minute: Math.min(99, base + clockTick) }
    })
  }, [sorted, clockTick, liveMirror?.matchId])

  const activeTheme = useMemo(() => {
    const m = viewMatches[index]
    return m ? themeForCompetition(m.competition.id) : null
  }, [index, viewMatches])

  const navBtn =
    'flex size-11 shrink-0 items-center justify-center rounded-full border border-tf-dark/15 bg-white text-base font-black text-tf-dark shadow-sm transition hover:border-rose-400/40 hover:bg-tf-night/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35 active:scale-95'

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2 border-b border-tf-dark/10 pb-4 sm:space-y-3 sm:pb-5 lg:border-0 lg:border-l-4 lg:border-rose-500/80 lg:pb-0 lg:pl-4">
          {eyebrow ? (
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-electric-deep sm:text-xs">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className={cn(
              'font-display text-2xl font-black uppercase leading-[1.1] tracking-tight text-tf-dark',
              'sm:text-[1.65rem] lg:text-3xl',
            )}
          >
            {title}
          </h2>
          <p className="max-w-2xl text-sm font-semibold leading-relaxed text-tf-dark/75 line-clamp-2 sm:line-clamp-none">
            {subtitle || 'Matchs en direct et à venir — ouvre un salon pour suivre le live.'}
          </p>
        </div>

        <div className="flex w-full items-center justify-center gap-2 lg:hidden sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + sorted.length) % sorted.length)}
            className={navBtn}
            aria-label="Match précédent"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % sorted.length)}
            className={navBtn}
            aria-label="Match suivant"
          >
            →
          </button>
        </div>
      </header>

      <div className="lg:hidden">
        <div
          ref={listRef}
          data-no-swipe="true"
          className="-mx-1 flex gap-4 overflow-x-auto px-1 py-2 pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory sm:gap-5 sm:py-3"
          aria-label="Carrousel des matchs"
        >
          {viewMatches.map((m, i) => (
            <div
              key={m.id}
              ref={(node) => {
                itemRefs.current[i] = node
              }}
              className="flex w-[min(100vw-2.5rem,320px)] shrink-0 snap-center flex-col items-stretch px-1 py-2 sm:w-[min(100%,300px)] sm:px-2"
            >
              <HubMatchStrip match={m} liveMirror={mirrorForCard(liveMirror, m)} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-dark/55">Navigation</p>
          <div
            className="flex flex-wrap items-center gap-1.5 sm:justify-end"
            role="tablist"
            aria-label="Choisir un match"
          >
            {viewMatches.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2.5 w-2.5 rounded-full border transition',
                  i === index
                    ? m.status === 'live'
                      ? 'border-rose-400/90 ring-2 ring-rose-300/50'
                      : 'border-slate-400'
                    : 'border-slate-300 bg-white',
                )}
                style={
                  i === index && m.status === 'live'
                    ? { background: '#e11d48' }
                    : i === index && activeTheme
                      ? { background: activeTheme.accent }
                      : i === index
                        ? { background: '#0ea5e9' }
                        : undefined
                }
                aria-label={`Match ${i + 1} : ${m.home.shortName} contre ${m.away.shortName}`}
              />
            ))}
          </div>
        </div>
      </div>

      <DesktopMatchGrid matches={viewMatches} liveMirror={liveMirror} />
    </section>
  )
}
