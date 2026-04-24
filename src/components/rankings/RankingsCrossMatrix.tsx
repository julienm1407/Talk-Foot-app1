import type { BigFiveLeagueId, LeagueStandingRow } from '../../data/leagueStandings'
import { cn } from '../../utils/cn'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import {
  formWindowPoints,
  gaPerMatch,
  gfPerMatch,
  goalDiff,
  pointsPerGoal,
  ppg,
  rankByScore,
} from '../../utils/rankingsMetrics'
import { FormStrip } from './FormStrip'

/**
 * Tableau unique : classement + rythme + buts + forme + efficacité + écart rang forme / rang points.
 * Toutes les lectures croisées au même endroit (scroll interne sur grandes ligues).
 */
export function RankingsCrossMatrix({
  rows,
  leagueId,
  className,
  caption,
}: {
  rows: LeagueStandingRow[]
  leagueId: BigFiveLeagueId
  className?: string
  caption?: string
}) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank)
  if (!sorted.length) return null

  const byForm = rankByScore(sorted, (r) => formWindowPoints(r.form, 5))

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-white/95', className)}>
      <div className="border-b border-tf-grey-pastel/40 bg-tf-grey-pastel/15 px-3 py-2 sm:px-4">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-tf-grey">Matrice classement</h3>
        {caption ? <p className="mt-0.5 text-[11px] font-semibold text-tf-grey">{caption}</p> : null}
      </div>
      <div className="max-h-[min(32rem,65vh)] overflow-auto overscroll-contain">
        <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
          <caption className="sr-only">{caption ?? 'Matrice classement et indicateurs croisés'}</caption>
          <thead className="sticky top-0 z-[1] border-b border-tf-grey-pastel/50 bg-white/95 backdrop-blur-sm">
            <tr className="text-[9px] font-black uppercase tracking-wider text-tf-grey">
              <th className="px-2 py-2 pl-3 sm:pl-4">#</th>
              <th className="px-1 py-2">Club</th>
              <th className="px-1 py-2 text-center">Pts</th>
              <th className="px-1 py-2 text-center">Pts/J</th>
              <th className="hidden px-1 py-2 text-center sm:table-cell">BM/j</th>
              <th className="hidden px-1 py-2 text-center sm:table-cell">BE/j</th>
              <th className="px-1 py-2 text-center">Diff</th>
              <th className="px-1 py-2 text-center">5j</th>
              <th className="hidden px-1 py-2 text-center md:table-cell">Pts/but</th>
              <th className="px-1 py-2 text-center" title="Rang si on classe sur la forme 5j − rang réel">
                Δ<sub className="text-[8px]">f</sub>
              </th>
              <th className="px-2 py-2 pr-3 text-center sm:pr-4">Forme</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const diff = goalDiff(r)
              const f5 = formWindowPoints(r.form, 5)
              const rf = byForm.get(r.teamId) ?? r.rank
              const delta = rf - r.rank
              return (
                <tr
                  key={`mx-${r.teamId}`}
                  className="border-b border-tf-grey-pastel/20 odd:bg-white even:bg-tf-grey-pastel/[0.08]"
                >
                  <td className="px-2 py-1.5 pl-3 tabular-nums text-tf-grey sm:pl-4">{r.rank}</td>
                  <td className="max-w-[7rem] truncate px-1 py-1.5 font-bold text-tf-dark sm:max-w-[9rem]">
                    {rankingsTeamShort(leagueId, r)}
                  </td>
                  <td className="px-1 py-1.5 text-center font-black tabular-nums text-tf-dark">{r.points}</td>
                  <td className="px-1 py-1.5 text-center tabular-nums text-tf-grey">
                    {r.played ? ppg(r).toFixed(2) : '—'}
                  </td>
                  <td className="hidden px-1 py-1.5 text-center tabular-nums text-emerald-800/90 sm:table-cell">
                    {r.played ? gfPerMatch(r).toFixed(2) : '—'}
                  </td>
                  <td className="hidden px-1 py-1.5 text-center tabular-nums text-sky-900/85 sm:table-cell">
                    {r.played ? gaPerMatch(r).toFixed(2) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-1 py-1.5 text-center font-bold tabular-nums',
                      diff > 0 && 'text-emerald-700',
                      diff < 0 && 'text-rose-600',
                      diff === 0 && 'text-tf-grey',
                    )}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="px-1 py-1.5 text-center font-bold tabular-nums text-violet-900">
                    {f5}/15
                  </td>
                  <td className="hidden px-1 py-1.5 text-center tabular-nums text-tf-grey md:table-cell">
                    {r.gf > 0 ? pointsPerGoal(r).toFixed(2) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-1 py-1.5 text-center font-black tabular-nums',
                      delta < 0 && 'text-emerald-700',
                      delta > 0 && 'text-rose-600',
                      delta === 0 && 'text-tf-grey',
                    )}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </td>
                  <td className="px-2 py-1 pr-3 sm:pr-4">
                    <FormStrip form={r.form} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-tf-grey-pastel/30 bg-tf-grey-pastel/10 px-3 py-2 text-[9px] font-semibold leading-snug text-tf-grey sm:px-4">
        Δ<sub>f</sub> négatif = la forme récente « mériterait » un meilleur rang que le classement actuel. BM/j = buts
        marqués par match, BE/j = encaissés par match.
      </p>
    </div>
  )
}
