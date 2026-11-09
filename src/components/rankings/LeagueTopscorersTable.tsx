import type { SeasonTopscorerRow } from '../../api/sportMonks/extractSeasonTopscorersFromSm'
import { competitionThemes } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'

export function LeagueTopscorersTable({
  leagueId,
  rows,
  onPlayerClick,
}: {
  leagueId: string
  rows: SeasonTopscorerRow[]
  onPlayerClick?: (row: SeasonTopscorerRow) => void
}) {
  const theme = competitionThemes[leagueId]

  return (
    <div className="overflow-x-auto rounded-2xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_78%,var(--tf-c30-surface-soft)_22%)]">
      <table className="w-full min-w-[420px] border-collapse text-left text-sm text-tf-app-fg">
        <caption className="sr-only">Meilleurs buteurs {theme?.name ?? leagueId}</caption>
        <thead>
          <tr
            className="sticky top-0 z-[1] border-b border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_92%,transparent)] text-[10px] font-black uppercase tracking-wider text-tf-app-muted"
            style={theme ? { borderBottomColor: `${theme.accent}44` } : undefined}
          >
            <th className="px-3 py-3 pl-4 sm:px-4">#</th>
            <th className="px-2 py-3">Joueur</th>
            <th className="px-2 py-3">Club</th>
            <th className="px-3 py-3 pr-4 text-center">Buts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.playerId}
              className="border-b border-[color:var(--tf-c30-border)] transition hover:bg-[color:rgb(var(--tf-app-fg-rgb)/0.07)]"
            >
              <td className="px-3 py-2.5 pl-4 text-xs font-black tabular-nums text-tf-app-muted sm:px-4">{r.rank}</td>
              <td className="px-2 py-2.5">
                <button
                  type="button"
                  onClick={() => onPlayerClick?.(r)}
                  className="flex min-w-0 items-center gap-2.5 text-left"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[color:var(--tf-c30-border)] bg-white">
                    {r.photoUrl ? (
                      <img src={r.photoUrl} alt="" className="h-full w-full object-cover object-top" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[11px] font-black text-tf-app-muted">
                        {r.name.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black">{r.name}</span>
                    {r.nationality ? (
                      <span className="block truncate text-[10px] font-semibold text-tf-app-muted">{r.nationality}</span>
                    ) : null}
                  </span>
                </button>
              </td>
              <td className="px-2 py-2.5">
                <span className="inline-flex min-w-0 items-center gap-2">
                  {r.teamLogo ? (
                    <img src={r.teamLogo} alt="" className="h-6 w-6 shrink-0 object-contain" />
                  ) : null}
                  <span className="truncate text-[12px] font-bold">{r.team}</span>
                </span>
              </td>
              <td className="px-3 py-2.5 pr-4 text-center">
                <span
                  className={cn(
                    'inline-flex min-w-[2rem] justify-center rounded-lg px-2 py-0.5 text-sm font-black',
                    r.rank <= 3 ? 'bg-tf-dark text-white' : 'bg-[color:rgb(var(--tf-app-fg-rgb)/0.08)]',
                  )}
                  style={r.rank === 1 && theme ? { backgroundColor: theme.accent, color: '#fff' } : undefined}
                >
                  {r.goals}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
