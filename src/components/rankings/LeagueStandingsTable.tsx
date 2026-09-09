import { competitionThemes } from '../../data/competitionThemes'
import type { LeagueStandingRow } from '../../data/leagueStandings'
import { teams } from '../../data/teams'
import { FormStrip } from './FormStrip'
import { FormSparkline } from './FormSparkline'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { gaPerMatch, gfPerMatch, ppg } from '../../utils/rankingsMetrics'

function crestColorsForTeam(teamId: string): { primary: string; secondary: string } {
  for (const list of Object.values(teams)) {
    const hit = list.find((t) => t.id === teamId)
    if (hit) return hit.colors
  }
  return { primary: '#0f172a', secondary: '#e2e8f0' }
}

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
  highlightTeamId,
  compact,
}: {
  leagueId: string
  rows: LeagueStandingRow[]
  className?: string
  /** Légende accessibilité (ex. SportMonks live vs maquette). */
  dataSourceLabel?: string
  /** Surligne la ligne du club courant (page club). */
  highlightTeamId?: string
  /** Version plus dense / scrollable pour encart club. */
  compact?: boolean
}) {
  const theme = competitionThemes[leagueId]
  const captionSuffix = dataSourceLabel?.trim() ?? 'données affichées'

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_78%,var(--tf-c30-surface-soft)_22%)]',
        compact && 'max-h-[min(320px,48vh)] overflow-y-auto [scrollbar-width:thin]',
        className,
      )}
    >
      <table
        className={cn(
          'w-full border-collapse text-left text-sm text-tf-app-fg',
          compact ? 'min-w-[480px]' : 'min-w-[640px]',
        )}
      >
        <caption className="sr-only">
          Classement {theme?.name ?? leagueId}, {captionSuffix}
        </caption>
        <thead>
          <tr
            className="sticky top-0 z-[1] border-b border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_92%,transparent)] text-[10px] font-black uppercase tracking-wider text-tf-app-muted"
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
            {!compact ? (
              <>
                <th className="hidden px-1 py-3 text-center text-[9px] font-black uppercase text-tf-app-muted sm:table-cell">
                  Pts/J
                </th>
                <th className="hidden px-1 py-3 text-center text-[9px] font-black uppercase text-tf-app-muted md:table-cell">
                  BM/j
                </th>
                <th className="hidden px-1 py-3 text-center text-[9px] font-black uppercase text-tf-app-muted md:table-cell">
                  BE/j
                </th>
              </>
            ) : null}
            <th className="px-2 py-3">Forme</th>
            <th className="px-3 py-3 pr-4 text-center">Tendance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.gf - r.ga
            const highlighted = Boolean(highlightTeamId && r.teamId === highlightTeamId)
            return (
              <tr
                key={`${r.teamId}-${r.rank}`}
                className={cn(
                  'border-b border-[color:var(--tf-c30-border)] transition hover:bg-[color:rgb(var(--tf-app-fg-rgb)/0.07)]',
                  highlighted && 'bg-sky-500/15 ring-1 ring-inset ring-sky-400/35',
                )}
              >
                <td className="px-3 py-2.5 pl-4 font-black text-tf-app-muted sm:px-4">{r.rank}</td>
                <td className="px-2 py-2.5 font-bold text-tf-app-fg">
                  <div className="flex min-w-0 items-center gap-2">
                    <ClubCrest
                      id={r.teamId}
                      shortName={rankingsTeamShort(leagueId, r)}
                      colors={crestColorsForTeam(r.teamId)}
                      sportMonksTeamId={r.sportMonksParticipantId}
                      size={28}
                      clickable
                      className="shrink-0"
                    />
                    <span className="min-w-0 truncate">{rankingsTeamShort(leagueId, r)}</span>
                  </div>
                </td>
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
                {!compact ? (
                  <>
                    <td className="hidden px-1 py-2.5 text-center tabular-nums text-tf-app-muted sm:table-cell">
                      {r.played ? ppg(r).toFixed(2) : '—'}
                    </td>
                    <td className="hidden px-1 py-2.5 text-center tabular-nums text-emerald-600 md:table-cell">
                      {r.played ? gfPerMatch(r).toFixed(2) : '—'}
                    </td>
                    <td className="hidden px-1 py-2.5 text-center tabular-nums text-rose-500 md:table-cell">
                      {r.played ? gaPerMatch(r).toFixed(2) : '—'}
                    </td>
                  </>
                ) : null}
                <td className="px-2 py-2.5">
                  <FormStrip form={r.form} />
                </td>
                <td className="px-3 py-2 pr-4">
                  <div className="flex items-center justify-center gap-2">
                    <TrendBadge trend={r.trend} />
                    {!compact ? <FormSparkline form={r.form} /> : null}
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
