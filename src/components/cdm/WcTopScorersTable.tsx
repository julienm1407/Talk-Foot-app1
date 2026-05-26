import { Link } from 'react-router-dom'
import type { WcTopScorerRow } from '../../types/wc2026'
import { getNationByIso } from '../../data/nations'
import { cn } from '../../utils/cn'

/**
 * Table compacte du classement des buteurs. Affiche un état d'attente
 * tant que l'API n'a pas envoyé de données.
 */
export function WcTopScorersTable({
  rows,
  className,
  limit = 10,
}: {
  rows: WcTopScorerRow[]
  className?: string
  limit?: number
}) {
  const display = rows.slice(0, limit)

  return (
    <section
      aria-label="Meilleurs buteurs Coupe du Monde 2026"
      className={cn(
        'overflow-hidden rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface shadow-tf-elev-1',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-tf-c30-border px-3 py-2">
        <p className="font-display text-sm font-black uppercase tracking-[0.18em] text-tf-app-fg">
          Soulier d'or — classement
        </p>
        <span className="text-[10px] font-bold uppercase tracking-wider text-tf-cdm-gold">
          Top {limit}
        </span>
      </header>

      {display.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-tf-app-muted">
          <p className="font-bold text-tf-app-fg">En attente du coup d'envoi</p>
          <p>Le classement se mettra à jour au fil des matchs.</p>
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-tf-c30-border text-[9px] font-black uppercase tracking-wider text-tf-app-muted">
              <th className="px-2 py-1.5 text-center">#</th>
              <th className="px-2 py-1.5">Joueur</th>
              <th className="px-2 py-1.5 text-center">Buts</th>
            </tr>
          </thead>
          <tbody>
            {display.map((row, idx) => {
              const nation = getNationByIso(row.player.nationIso)
              return (
                <tr
                  key={row.player.id}
                  className="border-b border-tf-c30-border/70 last:border-b-0 hover:bg-white/[0.04]"
                >
                  <td className="px-2 py-2 text-center font-black tabular-nums text-tf-cdm-gold">
                    {idx + 1}
                  </td>
                  <td className="px-2 py-2 font-bold text-tf-app-fg">
                    <span className="flex items-center gap-1.5">
                      {nation ? (
                        <Link
                          to={`/nation/${nation.iso.toLowerCase()}`}
                          className="inline-flex items-center gap-1 hover:text-tf-cdm-gold hover:underline"
                          aria-label={nation.nameFr}
                        >
                          <span aria-hidden>{nation.flag}</span>
                        </Link>
                      ) : null}
                      <span className="truncate">{row.player.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center font-black tabular-nums text-tf-app-fg">
                    {row.goals}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
