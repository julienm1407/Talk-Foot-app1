import { Link } from 'react-router-dom'
import type { LeagueStandingRow } from '../../data/leagueStandings'
import { competitionThemes } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'

export function LiveMatchStandingsPanel({
  leagueId,
  rows,
  homeTeamId,
  awayTeamId,
  loading,
  error,
  dataSourceLabel,
  projectedLive,
  light,
  scrollMaxClassName,
}: {
  leagueId: string
  rows: LeagueStandingRow[]
  homeTeamId?: string
  awayTeamId?: string
  loading?: boolean
  error?: string | null
  dataSourceLabel?: string
  projectedLive?: boolean
  light?: boolean
  /** Hauteur max du tableau (ex. popup pré-match). */
  scrollMaxClassName?: string
}) {
  const theme = competitionThemes[leagueId]

  if (loading) {
    return (
      <p className={cn('text-xs font-semibold', light ? 'text-[#3d5670]' : 'text-sky-200/80')}>
        Chargement du classement…
      </p>
    )
  }

  if (error && !rows.length) {
    return (
      <p className={cn('text-xs font-semibold', light ? 'text-rose-700' : 'text-rose-200/90')}>
        Classement indisponible ({error})
      </p>
    )
  }

  if (!rows.length) {
    return (
      <p className={cn('text-xs font-semibold', light ? 'text-[#3d5670]' : 'text-sky-200/80')}>
        Pas de classement pour cette compétition.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn('text-[10px] font-bold uppercase tracking-wide', light ? 'text-[#3d5670]' : 'text-sky-200/75')}>
          {theme?.name ?? leagueId}
          {projectedLive ? ' · projection live' : ''}
        </p>
        <Link
          to="/rankings"
          className={cn(
            'text-[10px] font-bold underline-offset-2 hover:underline',
            light ? 'text-[#023458]' : 'text-cyan-200/90',
          )}
        >
          Classement complet
        </Link>
      </div>
      {dataSourceLabel ? (
        <p className={cn('text-[9px] font-medium', light ? 'text-[#5a7088]' : 'text-sky-300/70')}>
          {dataSourceLabel}
          {projectedLive ? ' · +3 si mène, +1 chacun si nul' : ''}
        </p>
      ) : null}
      <div
        className={cn(
          'overflow-auto rounded-lg border',
          scrollMaxClassName ?? 'max-h-[min(42vh,320px)]',
          light ? 'border-slate-200 bg-white' : 'border-[#3a6690]/55 bg-[#0a1f35]/85',
        )}
      >
        <table className="w-full min-w-[280px] border-collapse text-left text-[11px]">
          <thead
            className={cn(
              'sticky top-0 z-[1] text-[9px] font-black uppercase tracking-wide',
              light ? 'bg-slate-50 text-slate-500' : 'bg-[#0e2a45] text-sky-200/80',
            )}
          >
            <tr>
              <th className="px-2 py-1.5 pl-2">#</th>
              <th className="px-2 py-1.5">Équipe</th>
              <th className="px-2 py-1.5 text-center">J</th>
              <th className="px-2 py-1.5 text-center font-black">Pts</th>
              <th className="px-2 py-1.5 pr-2 text-center">Diff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isHome = r.teamId === homeTeamId
              const isAway = r.teamId === awayTeamId
              const inMatch = isHome || isAway
              const diff = r.gf - r.ga
              return (
                <tr
                  key={`${r.teamId}-${r.rank}`}
                  className={cn(
                    'border-t',
                    light ? 'border-slate-100' : 'border-[#2b4d6d]/60',
                    inMatch &&
                      (light
                        ? 'bg-sky-50/90 font-bold text-[#023458]'
                        : 'bg-cyan-500/12 font-bold text-sky-50'),
                  )}
                >
                  <td className="px-2 py-1.5 pl-2 tabular-nums opacity-80">{r.rank}</td>
                  <td className="max-w-[8rem] truncate px-2 py-1.5">
                    {rankingsTeamShort(leagueId, r)}
                    {inMatch ? (
                      <span
                        className={cn(
                          'ml-1 text-[8px] font-black uppercase',
                          light ? 'text-emerald-700' : 'text-emerald-300',
                        )}
                      >
                        {isHome ? 'D' : 'E'}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 text-center tabular-nums opacity-90">{r.played}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums">{r.points}</td>
                  <td
                    className={cn(
                      'px-2 py-1.5 pr-2 text-center tabular-nums',
                      diff > 0 && (light ? 'text-emerald-700' : 'text-emerald-300'),
                      diff < 0 && (light ? 'text-rose-600' : 'text-rose-300'),
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
