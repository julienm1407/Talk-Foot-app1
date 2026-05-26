import { Link } from 'react-router-dom'
import type { WcGroup, WcStandingRow } from '../../types/wc2026'
import { getNationByIso } from '../../data/nations'
import { cn } from '../../utils/cn'

/**
 * Carte d'une poule CDM 2026 — affiche le classement à 4 lignes et le badge
 * de qualification (1er, 2e, 3e meilleur, éliminé).
 */
export function WcGroupCard({
  group,
  standing,
  className,
  compact = false,
}: {
  group: WcGroup
  standing: WcStandingRow[]
  className?: string
  compact?: boolean
}) {
  return (
    <section
      aria-label={`Poule ${group.id}`}
      className={cn(
        'flex flex-col overflow-hidden rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface shadow-tf-elev-1',
        className,
      )}
    >
      <header
        className={cn(
          'flex items-center justify-between border-b border-tf-c30-border px-3 py-2',
          'bg-gradient-to-r from-tf-c30-surface to-tf-c30-surface-soft',
        )}
      >
        <p className="font-display text-sm font-black uppercase tracking-[0.2em] text-tf-app-fg">
          Poule {group.id}
        </p>
        <span className="text-[10px] font-bold uppercase tracking-wider text-tf-app-muted">
          {standing.length} équipes
        </span>
      </header>

      <table className={cn('w-full text-left text-xs', compact && 'text-[11px]')}>
        <thead>
          <tr className="border-b border-tf-c30-border text-[9px] font-black uppercase tracking-wider text-tf-app-muted">
            <th className="px-2 py-1.5 text-center">#</th>
            <th className="px-2 py-1.5">Sélection</th>
            <th className="px-1.5 py-1.5 text-center" title="Joués">J</th>
            <th className="px-1.5 py-1.5 text-center" title="Différence">Diff</th>
            <th className="px-2 py-1.5 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standing.map((row) => {
            const nation = getNationByIso(row.iso)
            const podiumColor =
              row.rank === 1
                ? 'text-tf-cdm-gold'
                : row.rank === 2
                  ? 'text-emerald-400'
                  : row.rank === 3
                    ? 'text-sky-300'
                    : 'text-tf-app-muted'
            return (
              <tr
                key={row.iso}
                className="border-b border-tf-c30-border/70 last:border-b-0 hover:bg-white/[0.04]"
              >
                <td className={cn('px-2 py-2 text-center font-black tabular-nums', podiumColor)}>
                  {row.rank}
                </td>
                <td className="px-2 py-2 font-bold text-tf-app-fg">
                  {nation ? (
                    <Link
                      to={`/nation/${nation.iso.toLowerCase()}`}
                      className="inline-flex items-center gap-1.5 hover:text-tf-cdm-gold hover:underline"
                    >
                      <span aria-hidden>{nation.flag}</span>
                      <span className="truncate">{nation.nameFr}</span>
                    </Link>
                  ) : (
                    <span className="text-tf-app-muted">À déterminer</span>
                  )}
                </td>
                <td className="px-1.5 py-2 text-center tabular-nums text-tf-app-muted">{row.played}</td>
                <td className="px-1.5 py-2 text-center tabular-nums text-tf-app-muted">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-2 py-2 text-center font-black tabular-nums text-tf-app-fg">
                  {row.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
