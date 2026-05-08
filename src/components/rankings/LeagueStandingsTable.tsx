import { competitionThemes } from '../../data/competitionThemes'
import type { LeagueStandingRow } from '../../data/leagueStandings'
import { FormStrip } from './FormStrip'
import { FormSparkline } from './FormSparkline'
import { cn } from '../../utils/cn'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { gaPerMatch, gfPerMatch, ppg } from '../../utils/rankingsMetrics'

function TrendBadge({ trend }: { trend?: LeagueStandingRow['trend'] }) {
  if (trend === 'up')
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800" title="Montée">
        ↑
      </span>
    )
  if (trend === 'down')
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-rose-100 text-sm font-black text-rose-800" title="Descente">
        ↓
      </span>
    )
  if (trend === 'same')
    return (
      <span
        className="inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_85%,transparent)] text-sm font-black text-tf-app-muted"
        title="Stable"
      >
        →
      </span>
    )
  return <span className="text-[10px] font-bold text-tf-app-muted">—</span>
}

export function LeagueStandingsTable({
  leagueId,
  rows,
  className,
  dataSourceLabel,
}: {
  leagueId: string
  rows: LeagueStandingRow[]
  className?: string
  /** Légende accessibilité (ex. SportMonks live vs maquette). */
  dataSourceLabel?: string
}) {
  const theme = competitionThemes[leagueId]
  const captionSuffix = dataSourceLabel?.trim() ?? 'données affichées'

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_78%,var(--tf-c30-surface-soft)_22%)]',
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left text-sm text-tf-app-fg">
        <caption className="sr-only">
          Classement {theme?.name ?? leagueId}, {captionSuffix}
        </caption>
        <thead>
          <tr
            className="border-b border-[color:var(--tf-c30-border)] text-[10px] font-black uppercase tracking-wider text-tf-app-muted"
            style={theme ? { borderBottomColor: `${theme.accent}44` } : undefined}
          >
            <th className="px-3 py-3 pl-4 sm:px-4">#</th>
            <th className="px-2 py-3">Équipe</th>
            <th className="px-2 py-3 text-center">J</th>
            <th className="px-2 py-3 text-center">G</th>
            <th className="px-2 py-3 text-center">N</th>
            <th className="px-2 py-3 text-center">P</th>
            <th className="px-2 py-3 text-center" title="Buts Pour">
              BP
            </th>
            <th className="px-2 py-3 text-center" title="Buts Contre">
              BC
            </th>
            <th className="px-2 py-3 text-center">Diff</th>
            <th className="px-2 py-3 text-center font-black text-tf-app-fg">Pts</th>
            <th className="hidden px-1 py-3 text-center text-[9px] font-black uppercase text-tf-app-muted sm:table-cell">
              Pts/J
            </th>
            <th className="hidden px-1 py-3 text-center text-[9px] font-black uppercase text-tf-app-muted md:table-cell">
              BM/j
            </th>
            <th className="hidden px-1 py-3 text-center text-[9px] font-black uppercase text-tf-app-muted md:table-cell">
              BE/j
            </th>
            <th className="px-2 py-3">Forme</th>
            <th className="px-3 py-3 pr-4 text-center">Tendance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.gf - r.ga
            return (
              <tr
                key={`${r.teamId}-${r.rank}`}
                className="border-b border-[color:var(--tf-c30-border)] transition hover:bg-[color:rgb(var(--tf-app-fg-rgb)/0.07)]"
              >
                <td className="px-3 py-2.5 pl-4 font-black text-tf-app-muted sm:px-4">{r.rank}</td>
                <td className="px-2 py-2.5 font-bold text-tf-app-fg">{rankingsTeamShort(leagueId, r)}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-tf-app-muted">{r.played}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-tf-app-fg">{r.won}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-tf-app-fg">{r.drawn}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-tf-app-fg">{r.lost}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-emerald-700" title="Buts Pour">
                  {r.gf}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-rose-600" title="Buts Contre">
                  {r.ga}
                </td>
                <td
                  className={cn(
                    'px-2 py-2.5 text-center font-bold tabular-nums',
                    diff > 0 && 'text-emerald-600',
                    diff < 0 && 'text-rose-500',
                    diff === 0 && 'text-tf-app-muted',
                  )}
                >
                  {diff > 0 ? `+${diff}` : String(diff)}
                </td>
                <td className="px-2 py-2.5 text-center font-black text-tf-app-fg">{r.points}</td>
                <td className="hidden px-1 py-2.5 text-center tabular-nums text-tf-app-muted sm:table-cell">
                  {r.played ? ppg(r).toFixed(2) : '—'}
                </td>
                <td className="hidden px-1 py-2.5 text-center tabular-nums text-emerald-600 md:table-cell">
                  {r.played ? gfPerMatch(r).toFixed(2) : '—'}
                </td>
                <td className="hidden px-1 py-2.5 text-center tabular-nums text-rose-500 md:table-cell">
                  {r.played ? gaPerMatch(r).toFixed(2) : '—'}
                </td>
                <td className="px-2 py-2.5">
                  <FormStrip form={r.form} />
                </td>
                <td className="px-3 py-2 pr-4">
                  <div className="flex items-center justify-center gap-2">
                    <TrendBadge trend={r.trend} />
                    <FormSparkline form={r.form} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
