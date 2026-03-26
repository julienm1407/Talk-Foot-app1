import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../../contexts/MatchesContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { ClubCrest } from '../brand/ClubCrest'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { cn } from '../../utils/cn'
import { getGroupAccess, sortGroupsByFanAffinity } from '../../utils/groupAccess'
import type { Match } from '../../types/match'

/** Rappel discret : une ligne, pas une carte pleine largeur */
function MatchFavChip({ m }: { m: Match }) {
  const live = m.status === 'live'
  const sc = m.score
  const scoreStr = sc ? `${sc.home}-${sc.away}` : null
  const sub = live ? (formatRelativeMinute(m.minute) ?? scoreStr ?? 'Live') : formatKickoff(m.kickoffAt)

  return (
    <Link
      to={`/channel/${m.id}`}
      title={`${m.home.shortName} — ${m.away.shortName}`}
      className={cn(
        'tf-interactive-press inline-flex max-w-[170px] shrink-0 snap-start items-center gap-0.5 rounded-md border border-slate-200/90 bg-white/90 py-px pl-0.5 pr-1 shadow-sm transition',
        'hover:border-slate-300 hover:bg-white',
        live && 'ring-1 ring-rose-200/60',
      )}
    >
      <ClubCrest id={m.home.id} shortName={m.home.shortName} colors={m.home.colors} size={14} className="shrink-0" />
      <span className="min-w-0 truncate text-[9px] font-black leading-none text-slate-800">{m.home.shortName}</span>
      <span className="shrink-0 text-[8px] font-bold text-slate-400" aria-hidden>
        ·
      </span>
      <span className="min-w-0 truncate text-[9px] font-black leading-none text-slate-800">{m.away.shortName}</span>
      <ClubCrest id={m.away.id} shortName={m.away.shortName} colors={m.away.colors} size={14} className="shrink-0" />
      <span className="ml-0.5 inline-flex shrink-0 items-center gap-0.5 border-l border-slate-200/80 pl-1.5">
        {live ? (
          <span className="size-1 animate-pulse rounded-full bg-rose-500" aria-hidden />
        ) : null}
        <span className="tabular-nums text-[9px] font-bold text-slate-600">{sub}</span>
      </span>
    </Link>
  )
}

export function FavoritesEncart({ className }: { className?: string }) {
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

  const show = favoriteClubIds.length > 0 || favoriteSalons.length > 0
  if (!show) return null

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-tf-electric/18 bg-gradient-to-r from-tf-ice/90 via-white to-tf-electric-soft/35 px-2 py-2 shadow-sm sm:rounded-2xl sm:px-3 sm:py-2.5',
        className,
      )}
      aria-label="Favoris : matchs de tes clubs et salons suivis"
    >
      {favoriteClubIds.length > 0 ? (
        <div className="flex min-h-[2rem] flex-wrap items-center gap-x-2 gap-y-1.5 sm:min-h-0 sm:flex-nowrap sm:gap-x-3">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span
              className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-amber-300/95 to-amber-500/90 text-[11px] text-amber-950 shadow-sm ring-1 ring-amber-200/80 sm:size-7 sm:text-xs"
              aria-hidden
            >
              ★
            </span>
            <h2 className="font-display text-[11px] font-black uppercase tracking-wide text-tf-dark sm:text-xs sm:normal-case sm:tracking-tight">
              Tes favoris
            </h2>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:flex-nowrap">
            {loading ? (
              <span className="text-[10px] font-semibold text-tf-grey">Chargement…</span>
            ) : clubMatches.length === 0 ? (
              <span className="text-[10px] font-semibold text-tf-grey">Aucun match club pour l’instant.</span>
            ) : (
              <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] sm:pb-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80">
                {clubMatches.map((m) => (
                  <MatchFavChip key={m.id} m={m} />
                ))}
              </div>
            )}
          </div>

          <Link
            to="/matches"
            className="shrink-0 text-[10px] font-bold text-tf-electric-deep underline-offset-2 hover:underline sm:text-[11px]"
          >
            Tous les matchs
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-amber-300/95 to-amber-500/90 text-[11px] text-amber-950 shadow-sm ring-1 ring-amber-200/80"
              aria-hidden
            >
              ★
            </span>
            <h2 className="font-display text-[11px] font-black text-tf-dark sm:text-xs">Tes favoris</h2>
          </div>
          <Link
            to="/matches"
            className="text-[10px] font-bold text-tf-electric-deep underline-offset-2 hover:underline"
          >
            Matchs
          </Link>
        </div>
      )}

      {favoriteSalons.length > 0 ? (
        <div
          className={cn(
            'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-200/60 pt-2',
            favoriteClubIds.length === 0 && 'mt-0 border-t-0 pt-0',
          )}
        >
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-slate-500">Salons</span>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
            {favoriteSalons.map((g) => (
              <Link
                key={g.id}
                to={`/group/${g.id}`}
                className="tf-interactive-press inline-flex max-w-[160px] items-center gap-1 rounded-md border border-slate-200/90 bg-white/90 py-0.5 pl-1 pr-1.5 text-[9px] font-semibold text-slate-800 shadow-sm transition hover:border-slate-300"
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
            className="shrink-0 text-[10px] font-bold text-tf-electric-deep underline-offset-2 hover:underline"
          >
            Groupes
          </Link>
        </div>
      ) : null}
    </section>
  )
}
