import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../../contexts/MatchesContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { useAppearance } from '../../contexts/AppearanceContext'
import { ClubCrest } from '../brand/ClubCrest'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { cn } from '../../utils/cn'
import { getGroupAccess, sortGroupsByFanAffinity } from '../../utils/groupAccess'
import type { Match } from '../../types/match'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'

function MatchFavChip({ m, light }: { m: Match; light: boolean }) {
  const live = m.status === 'live'
  const linearMin = useLinearDisplayedLiveMinute(m)
  const sc = m.score
  const scoreStr = sc ? `${sc.home}-${sc.away}` : null
  const sub = live ? (formatRelativeMinute(linearMin) ?? scoreStr ?? 'Live') : formatKickoff(m.kickoffAt)

  return (
    <Link
      to={`/channel/${m.id}`}
      title={`${m.home.shortName} — ${m.away.shortName}`}
      className={cn(
        'tf-interactive-press inline-flex max-w-[170px] shrink-0 snap-start items-center gap-0.5 rounded-md border py-px pl-0.5 pr-1 shadow-sm transition',
        light
          ? 'border-slate-200/90 bg-white/90 hover:border-slate-300 hover:bg-white'
          : 'border-white/15 bg-white/[0.08] hover:border-white/25 hover:bg-white/[0.12]',
        live && (light ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-rose-500/45'),
      )}
    >
      <ClubCrest id={m.home.id} shortName={m.home.shortName} colors={m.home.colors} size={14} className="shrink-0" />
      <span
        className={cn(
          'min-w-0 truncate text-[9px] font-black leading-none',
          light ? 'text-slate-800' : 'text-tf-app-fg',
        )}
      >
        {m.home.shortName}
      </span>
      <span className={cn('shrink-0 text-[8px] font-bold', light ? 'text-slate-400' : 'text-tf-app-subtle')} aria-hidden>
        ·
      </span>
      <span
        className={cn(
          'min-w-0 truncate text-[9px] font-black leading-none',
          light ? 'text-slate-800' : 'text-tf-app-fg',
        )}
      >
        {m.away.shortName}
      </span>
      <ClubCrest id={m.away.id} shortName={m.away.shortName} colors={m.away.colors} size={14} className="shrink-0" />
      <span
        className={cn(
          'ml-0.5 inline-flex shrink-0 items-center gap-0.5 border-l pl-1.5',
          light ? 'border-slate-200/80' : 'border-white/15',
        )}
      >
        {live ? (
          <span className="size-1 animate-pulse rounded-full bg-rose-500" aria-hidden />
        ) : null}
        <span
          className={cn('tabular-nums text-[9px] font-bold', light ? 'text-slate-600' : 'text-tf-app-muted')}
        >
          {sub}
        </span>
      </span>
    </Link>
  )
}

export function FavoritesEncart({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { matches, loading } = useMatches()
  const { favoriteClubIds, favoriteLeagueId, hideRivalSalons } = useFanPreferences()
  const { groups, isJoined } = useSupporterGroups()

  const accessPrefs = useMemo(
    () => ({
      favoriteClubIds,
      favoriteLeagueId,
      hideRivalSalons,
    }),
    [favoriteClubIds, favoriteLeagueId, hideRivalSalons],
  )

  const favoriteIdSet = useMemo(() => new Set(favoriteClubIds), [favoriteClubIds])

  const clubMatches = useMemo(() => {
    if (favoriteClubIds.length === 0) return []
    const set = favoriteIdSet
    return matches
      .filter((m) => m.status === 'live' || m.status === 'upcoming')
      .filter((m) => set.has(m.home.id) || set.has(m.away.id))
      .sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1
        if (b.status === 'live' && a.status !== 'live') return 1
        return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
      })
      .slice(0, 6)
  }, [matches, favoriteClubIds, favoriteIdSet])

  const favoriteSalons = useMemo(() => {
    const joined = groups.filter((g) => isJoined(g.id) || g.createdBy === 'me')
    return sortGroupsByFanAffinity(joined, accessPrefs)
      .filter((g) => getGroupAccess(g, accessPrefs) !== 'hidden')
      .slice(0, 5)
  }, [groups, isJoined, accessPrefs])

  const showMatchesBlock = favoriteClubIds.length > 0
  const showSalonsBlock = favoriteSalons.length > 0
  if (!showMatchesBlock && !showSalonsBlock) return null

  const panelLight =
    'border border-tf-electric/18 bg-gradient-to-r from-tf-ice/90 via-white to-tf-electric-soft/35 shadow-sm'
  const panelDark =
    'border border-white/12 bg-gradient-to-br from-[#0d1a2e]/95 to-[#071422]/98 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'

  return (
    <div className={cn('space-y-4', className)} aria-label="Raccourcis favoris">
      {showMatchesBlock ? (
        <section
          className={cn(
            'overflow-hidden rounded-xl px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-2.5',
            L ? panelLight : panelDark,
          )}
          aria-label="Matchs de tes clubs favoris"
        >
          <div className="flex min-h-[2rem] flex-wrap items-center gap-x-2 gap-y-1.5 sm:min-h-0 sm:flex-nowrap sm:gap-x-3">
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-md text-[11px] shadow-sm ring-1 sm:size-7 sm:text-xs',
                  L
                    ? 'bg-gradient-to-br from-amber-300/95 to-amber-500/90 text-amber-950 ring-amber-200/80'
                    : 'bg-gradient-to-br from-amber-400/90 to-amber-600/85 text-amber-950 ring-amber-300/40',
                )}
                aria-hidden
              >
                ★
              </span>
              <h2
                className={cn(
                  'font-display text-[11px] font-black uppercase tracking-wide sm:text-xs sm:normal-case sm:tracking-tight',
                  L ? 'text-tf-dark' : 'text-tf-app-fg',
                )}
              >
                Tes favoris
              </h2>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:flex-nowrap">
              {loading ? (
                <span className={cn('text-[10px] font-semibold', L ? 'text-tf-grey' : 'text-tf-app-muted')}>
                  Chargement…
                </span>
              ) : clubMatches.length === 0 ? (
                <span className={cn('text-[10px] font-semibold', L ? 'text-tf-grey' : 'text-tf-app-muted')}>
                  Aucun match club pour l’instant.
                </span>
              ) : (
                <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] sm:pb-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80">
                  {clubMatches.map((m) => (
                    <MatchFavChip key={m.id} m={m} light={L} />
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/match"
              className={cn(
                'shrink-0 text-[10px] font-bold underline-offset-2 hover:underline sm:text-[11px]',
                L ? 'text-tf-electric-deep' : 'text-sky-300',
              )}
            >
              Tous les matchs
            </Link>
          </div>
        </section>
      ) : null}

      {showSalonsBlock ? (
        <section
          className={cn(
            'overflow-hidden rounded-xl px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-2.5',
            L ? panelLight : panelDark,
          )}
          aria-label="Tes salons suivis"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span
              className={cn(
                'shrink-0 text-[9px] font-bold uppercase tracking-wider',
                L ? 'text-slate-500' : 'text-tf-app-muted',
              )}
            >
              Salons
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {favoriteSalons.map((g) => (
                <Link
                  key={g.id}
                  to={`/group/${g.id}`}
                  className={cn(
                    'tf-interactive-press inline-flex max-w-[160px] items-center gap-1 rounded-md border py-0.5 pl-1 pr-1.5 text-[9px] font-semibold shadow-sm transition',
                    L
                      ? 'border-slate-200/90 bg-white/90 text-slate-800 hover:border-slate-300'
                      : 'border-white/15 bg-white/[0.08] text-tf-app-fg hover:border-violet-400/35 hover:bg-white/[0.1]',
                  )}
                >
                  <span className="shrink-0 text-[11px] leading-none" aria-hidden>
                    {g.emoji}
                  </span>
                  <span className="truncate">{g.name}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/groups"
              className={cn(
                'shrink-0 text-[10px] font-bold underline-offset-2 hover:underline',
                L ? 'text-tf-electric-deep' : 'text-violet-300',
              )}
            >
              Groupes
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
