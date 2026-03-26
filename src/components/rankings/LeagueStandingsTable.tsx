import { competitionThemes } from '../../data/competitionThemes'
import type { LeagueStandingRow } from '../../data/leagueStandings'
import { teams } from '../../data/teams'
import { FormStrip } from './FormStrip'
import { FormSparkline } from './FormSparkline'
import { cn } from '../../utils/cn'

export function LeagueStandingsTable({
  leagueId,
  rows,
  className,
}: {
  leagueId: string
  rows: LeagueStandingRow[]
  className?: string
}) {
  const theme = competitionThemes[leagueId]
  const list = teams[leagueId as keyof typeof teams]

  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-tf-grey-pastel/50', className)}>
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Classement {theme?.name ?? leagueId}, données mock
        </caption>
        <thead>
          <tr
            className="border-b border-tf-grey-pastel/50 text-[10px] font-black uppercase tracking-wider text-tf-grey"
            style={theme ? { borderBottomColor: `${theme.accent}33` } : undefined}
          >
            <th className="px-3 py-3 pl-4 sm:px-4">#</th>
            <th className="px-2 py-3">Équipe</th>
            <th className="px-2 py-3 text-center">J</th>
            <th className="px-2 py-3 text-center">G</th>
            <th className="px-2 py-3 text-center">N</th>
            <th className="px-2 py-3 text-center">P</th>
            <th className="px-2 py-3 text-center">Buts</th>
            <th className="px-2 py-3 text-center">Diff</th>
            <th className="px-2 py-3 text-center font-black text-tf-dark">Pts</th>
            <th className="px-2 py-3">Forme</th>
            <th className="px-3 py-3 pr-4 text-center">Tendance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const t = list?.find((x) => x.id === r.teamId)
            const diff = r.gf - r.ga
            return (
              <tr
                key={r.teamId}
                className="border-b border-tf-grey-pastel/30 transition hover:bg-tf-grey-pastel/15"
              >
                <td className="px-3 py-2.5 pl-4 font-black text-tf-grey sm:px-4">{r.rank}</td>
                <td className="px-2 py-2.5 font-bold text-tf-dark">{t?.shortName ?? r.teamId}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-tf-grey">{r.played}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{r.won}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{r.drawn}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{r.lost}</td>
                <td className="px-2 py-2.5 text-center tabular-nums text-tf-grey">
                  {r.gf}:{r.ga}
                </td>
                <td
                  className={cn(
                    'px-2 py-2.5 text-center font-bold tabular-nums',
                    diff > 0 && 'text-emerald-700',
                    diff < 0 && 'text-rose-600',
                    diff === 0 && 'text-tf-grey',
                  )}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="px-2 py-2.5 text-center font-black text-tf-dark">{r.points}</td>
                <td className="px-2 py-2.5">
                  <FormStrip form={r.form} />
                </td>
                <td className="px-3 py-2 pr-4">
                  <div className="flex justify-center">
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
