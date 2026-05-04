import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation, LiveMirrorForCard } from '../../types/liveSimulation'
import { MatchSpotlightCard } from './MatchSpotlightCard'
import { cn } from '../../utils/cn'
import { themeForCompetition } from '../../data/competitionThemes'
import { useAppearance } from '../../contexts/AppearanceContext'

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
  light,
}: {
  matches: Match[]
  liveMirror?: CarouselLiveMirror
  light: boolean
}) {
  if (matches.length === 0) return null

  const useMoreTile = matches.length > 6
  const count = useMoreTile ? 5 : Math.min(6, matches.length)
  const slice = matches.slice(0, count)
  const extra = matches.length - count

  return (
    <div className="hidden lg:block" aria-label="Matchs à l’affiche">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8 2xl:gap-10">
        {slice.map((m) => (
          <div key={m.id} className="min-w-0">
            <MatchSpotlightCard match={m} liveMirror={mirrorForCard(liveMirror, m)} />
          </div>
        ))}
        {extra > 0 ? (
          <Link
            to="/match"
            className={cn(
              'flex min-h-[240px] min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center shadow-inner transition',
              light
                ? 'border-sky-400/35 bg-gradient-to-br from-sky-50/90 via-white to-tf-ice/80 hover:border-sky-500/55 hover:from-sky-50'
                : 'border-sky-500/40 bg-gradient-to-br from-[#0d1a2e]/90 via-[#071422]/95 to-[#030b18]/98 hover:border-sky-400/55',
            )}
          >
            <span className="font-display text-2xl font-black text-tf-app-fg">+{extra}</span>
            <span className="mt-2 max-w-[14rem] text-sm font-semibold leading-snug text-tf-app-muted">
              Autres rencontres sur la page Match — dates, ligues et rappels.
            </span>
            <span
              className={cn(
                'mt-4 rounded-xl px-4 py-2 text-xs font-black',
                light ? 'bg-tf-dark text-white' : 'bg-white text-tf-night',
              )}
            >
              Ouvrir le calendrier
            </span>
          </Link>
        ) : null}
      </div>
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
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const sorted = useMemo(() => {
    const ms = [...matches]
    ms.sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    return ms.sort(
      (a, b) =>
        (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0),
    )
  }, [matches])

  const [carouselNowMs, setCarouselNowMs] = useState(() => Date.now())
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
    const id = window.setInterval(() => setCarouselNowMs(Date.now()), 1000)
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
      const ko = new Date(m.kickoffAt).getTime()
      const linearMin = Math.min(99, Math.max(1, Math.floor((carouselNowMs - ko) / 60_000)))
      return { ...m, minute: linearMin }
    })
  }, [sorted, carouselNowMs, liveMirror?.matchId])

  const activeTheme = useMemo(() => {
    const m = viewMatches[index]
    return m ? themeForCompetition(m.competition.id) : null
  }, [index, viewMatches])

  const navBtn = cn(
    'flex size-11 shrink-0 items-center justify-center rounded-full border text-base font-black shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35 active:scale-95',
    L
      ? 'border-tf-dark/15 bg-white text-tf-dark hover:border-rose-400/40 hover:bg-tf-night/[0.04]'
      : 'border-white/20 bg-white/10 text-tf-app-fg hover:border-rose-400/45 hover:bg-white/[0.14]',
  )

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div
          className={cn(
            'min-w-0 flex-1 space-y-3 border-b pb-5 sm:space-y-3 sm:pb-6 lg:border-0 lg:border-l-[3px] lg:border-rose-500 lg:pb-0 lg:pl-5',
            L ? 'border-tf-dark/10' : 'border-white/15',
          )}
        >
          {eyebrow ? (
            <p
              className={cn(
                'text-xs font-black uppercase tracking-[0.14em] sm:text-[13px]',
                L ? 'text-sky-700' : 'text-sky-300',
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className={cn(
              'font-display text-[1.65rem] font-black leading-[1.12] tracking-tight text-tf-app-fg sm:text-3xl lg:text-[2rem]',
            )}
          >
            {title}
          </h2>
          <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-tf-app-muted sm:text-base">
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
          className="-mx-1 flex gap-5 overflow-x-auto px-1 py-2 pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory sm:gap-6 sm:py-4"
          aria-label="Carrousel des matchs"
        >
          {viewMatches.map((m, i) => (
            <div
              key={m.id}
              ref={(node) => {
                itemRefs.current[i] = node
              }}
              className="flex w-[var(--tf-carousel-slide)] max-w-full shrink-0 snap-center flex-col items-stretch px-1 py-1 sm:px-2"
            >
              <MatchSpotlightCard match={m} liveMirror={mirrorForCard(liveMirror, m)} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-[0.2em]',
              L ? 'text-tf-dark/75' : 'text-sky-200/95',
            )}
          >
            Navigation
          </p>
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
                  /* Cible ≥ 44px (WCAG) : pastille au centre, zone cliquable large */
                  'grid min-h-tf-touch min-w-tf-touch place-items-center rounded-full border-0 bg-transparent p-0 transition',
                )}
                aria-label={`Match ${i + 1} : ${m.home.shortName} contre ${m.away.shortName}`}
              >
                <span
                  className={cn(
                    'block h-2.5 w-2.5 rounded-full border transition',
                    i === index
                      ? m.status === 'live'
                        ? 'border-rose-400/90 ring-2 ring-rose-300/50'
                        : L
                          ? 'border-slate-400'
                          : 'border-slate-500'
                      : L
                        ? 'border-slate-300 bg-white'
                        : 'border-slate-600 bg-slate-800/90',
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
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <DesktopMatchGrid matches={viewMatches} liveMirror={liveMirror} light={L} />
    </section>
  )
}
