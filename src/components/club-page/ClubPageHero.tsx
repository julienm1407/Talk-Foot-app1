import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import type { Team } from '../../types/match'
import type { ClubPageMock } from '../../data/clubPageMock'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

const ctaBase =
  'tf-interactive-press inline-flex min-h-tf-touch min-w-0 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-xs font-black sm:gap-2 sm:px-4 sm:text-sm'

function formResultPoints(r: 'V' | 'N' | 'D'): number {
  if (r === 'V') return 1
  if (r === 'N') return 0.5
  return 0
}

function longestLossStreak(form: Array<'V' | 'N' | 'D'>): number {
  let best = 0
  let run = 0
  for (const r of form) {
    if (r === 'D') {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

function moodFromForm(form: Array<'V' | 'N' | 'D'>): { score: number; label: string } {
  const base = Math.round((form.reduce((acc, r) => acc + formResultPoints(r), 0) / 5) * 100)
  const lossStreak = longestLossStreak(form)
  const streakPenalty = lossStreak >= 4 ? 22 : lossStreak === 3 ? 12 : 0
  const score = Math.max(0, Math.min(100, base - streakPenalty))

  const label =
    score < 20
      ? 'En crise'
      : score < 35
        ? 'En difficulté'
        : score < 50
          ? 'Fragile'
          : score < 65
            ? 'Irrégulier'
            : score < 80
              ? 'En progrès'
              : 'En confiance'

  return { score, label }
}

export function ClubPageHero({
  team,
  data,
  sportMonksTeamId,
}: {
  team: Team
  data: ClubPageMock
  sportMonksTeamId?: number
}) {
  const [sticky, setSticky] = useState(false)
  const heroEndRef = useRef<HTMLDivElement>(null)
  const { favoriteClubIds, setFavoriteClubIds } = useFanPreferences()
  const isFollowing = favoriteClubIds.includes(team.id)
  const mood = moodFromForm(data.formStrip)
  const formSource = data.formStripFromApi ? 'SportMonks' : 'estimation interne'

  const toggleFollow = useCallback(() => {
    if (isFollowing) {
      setFavoriteClubIds(favoriteClubIds.filter((id) => id !== team.id))
    } else {
      setFavoriteClubIds([team.id, ...favoriteClubIds.filter((id) => id !== team.id)].slice(0, 3))
    }
  }, [isFollowing, favoriteClubIds, setFavoriteClubIds, team.id])

  const sync = useCallback(() => {
    const el = heroEndRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setSticky(r.top < 64)
  }, [])

  useEffect(() => {
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  const ctaRow = (compact: boolean) => (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center',
        compact ? 'sm:gap-1.5' : 'sm:gap-2',
      )}
    >
      <Link
        to="/groups"
        className={cn(
          ctaBase,
          'border-tf-nav-groups/45 bg-tf-nav-groups/20 text-violet-100 shadow-[0_0_20px_rgba(108,92,231,0.18)] transition hover:border-tf-nav-groups/60 hover:bg-tf-nav-groups/30',
          TF_FOCUS_VISIBLE,
        )}
      >
        Tribunes &amp; groupes
      </Link>
      <Link
        to="/match"
        className={cn(
          ctaBase,
          'border-sky-400/40 bg-sky-500/10 text-sky-100 transition hover:border-sky-400/55 hover:bg-sky-500/20',
          TF_FOCUS_VISIBLE,
        )}
      >
        Matchs &amp; agenda
      </Link>
      <button
        type="button"
        onClick={toggleFollow}
        aria-pressed={isFollowing}
        className={cn(
          ctaBase,
          'border-amber-400/35 bg-amber-500/10 text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-500/20',
          isFollowing && 'border-amber-300/50 bg-amber-500/20 ring-1 ring-amber-400/30',
          TF_FOCUS_VISIBLE,
        )}
      >
        <span aria-hidden>{isFollowing ? '★' : '☆'}</span>{' '}
        {isFollowing ? 'Dans mes favoris' : 'Suivre le club'}
      </button>
    </div>
  )

  const homeName = data.upcoming.homeName ?? (data.upcoming.venue === 'dom' ? team.name : data.upcoming.opponent)
  const awayName = data.upcoming.awayName ?? (data.upcoming.venue === 'dom' ? data.upcoming.opponent : team.name)
  const homeCrest = data.upcoming.homeCrest ?? { id: team.id, shortName: team.shortName, colors: team.colors }
  const awayCrest =
    data.upcoming.awayCrest ??
    (data.upcoming.venue === 'dom'
      ? { id: `${team.id}-opponent`, shortName: data.upcoming.opponent.slice(0, 3).toUpperCase(), colors: team.colors }
      : { id: team.id, shortName: team.shortName, colors: team.colors })

  return (
    <>
      <section
        className={cn(
          'relative w-full overflow-hidden',
          'border-b border-white/10',
          data.onFire && !data.formStripFromApi && 'ring-1 ring-amber-500/25',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(80% 60% at 50% 0%, color-mix(in srgb, ${team.colors.primary} 35%, transparent), transparent 60%),
              linear-gradient(180deg, #030712 0%, #0a1628 45%, #030712 100%)
            `,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40 [animation:tf-club-smoke_8s_ease-in-out_infinite_alternate]"
          style={{
            background: `repeating-linear-gradient(
              105deg,
              color-mix(in srgb, ${team.colors.secondary} 20%, transparent) 0 40px,
              transparent 40px 90px
            )`,
          }}
          aria-hidden
        />
        <div className="relative z-[1] mx-auto flex max-w-tf-wide flex-col items-center px-3 pb-8 pt-6 sm:px-5 sm:pb-10 sm:pt-8">
          {data.onFire && !data.formStripFromApi ? (
            <p className="mb-2 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 sm:mb-2.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              Club en feu
            </p>
          ) : null}
          {data.matchMode && !data.formStripFromApi ? (
            <p className="mb-1.5 flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-200">
              <span className="size-1.5 animate-pulse rounded-full bg-rose-400" aria-hidden />
              Fenêtre match
            </p>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200/75">
            Forme actuelle · {mood.label}
          </p>
          <div className="mt-2 w-full max-w-[22rem] rounded-full border border-sky-300/25 bg-black/35 p-1">
            <div className="h-1.5 rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400"
                style={{ width: `${mood.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-[10px] font-bold text-sky-100/80">
              Indice forme {mood.score}/100 · source {formSource}
            </p>
          </div>
          <div className="mt-2.5 flex items-center gap-3 sm:mt-3 sm:gap-4">
            <ClubCrest
              id={team.id}
              shortName={team.shortName}
              colors={team.colors}
              sportMonksTeamId={sportMonksTeamId}
              size={88}
              className="!rounded-[1.4rem] shadow-lg ring-1 ring-white/20"
            />
            <div>
              <h1 className="max-w-[18ch] font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                {team.name}
              </h1>
              <p className="mt-0.5 text-sm font-bold text-sky-200/80">Espace supporters Talk Foot</p>
            </div>
          </div>
          <div className="mt-3 w-full max-w-2xl rounded-2xl border border-sky-400/25 bg-sky-500/10 px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-sky-200/90">Prochain match</p>
            <p className="mt-1 text-sm font-black text-white sm:text-base">
              {data.upcoming.league} · {data.upcoming.matchday}
            </p>
            <div className="mt-1.5 flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-sky-200/90">
                  {data.upcoming.venue === 'dom' ? 'Domicile' : 'Extérieur'}
                </p>
                <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <ClubCrest
                      id={homeCrest.id}
                      shortName={homeCrest.shortName}
                      colors={homeCrest.colors}
                      logoUrl={data.upcoming.homeLogoUrl}
                      sportMonksTeamId={homeCrest.sportMonksTeamId}
                      size={28}
                      clickable={false}
                      className="shrink-0 !rounded-full"
                    />
                    <span className="truncate text-sm font-black text-sky-50 sm:text-[15px]">{homeName}</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-wide text-sky-200/85">vs</span>
                  <div className="flex min-w-0 items-center justify-end gap-1.5">
                    <span className="truncate text-right text-sm font-black text-sky-50 sm:text-[15px]">{awayName}</span>
                    <ClubCrest
                      id={awayCrest.id}
                      shortName={awayCrest.shortName}
                      colors={awayCrest.colors}
                      logoUrl={data.upcoming.awayLogoUrl}
                      sportMonksTeamId={awayCrest.sportMonksTeamId}
                      size={28}
                      clickable={false}
                      className="shrink-0 !rounded-full"
                    />
                  </div>
                </div>
              </div>
              <p className="shrink-0 rounded-lg border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 text-lg font-black leading-none text-amber-100 sm:text-xl">
                {data.upcoming.kickoff}
              </p>
            </div>
          </div>
          <div className="mt-5 w-full max-w-2xl sm:mt-6">{ctaRow(false)}</div>
        </div>
        <div ref={heroEndRef} className="pointer-events-none absolute bottom-0 left-0 h-1 w-1 opacity-0" aria-hidden />
      </section>

      <div
        className={cn(
          'sticky top-0 z-40 w-full border-b border-white/10 transition-all duration-300',
          sticky
            ? 'max-h-32 translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 max-h-0 overflow-hidden border-transparent py-0 opacity-0',
        )}
        style={{ background: 'color-mix(in srgb, #061222 88%, black)' }}
      >
        <div className="mx-auto max-w-tf-wide px-3 py-2.5 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 truncate text-center text-xs font-bold text-sky-100/90 sm:text-left">
              {team.shortName} · espace club
            </p>
            <Link
              to="/match"
              className={cn(
                'inline-flex min-h-tf-touch items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 text-xs font-bold text-sky-100 transition hover:border-sky-400/50 hover:bg-sky-500/20',
                TF_FOCUS_VISIBLE,
              )}
            >
              Voir les matchs
            </Link>
          </div>
        </div>
      </div>

      <div className="h-0" />
    </>
  )
}
