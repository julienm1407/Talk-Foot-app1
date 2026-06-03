import type { WcPlayer, WcPosition, WcSquad } from '../../types/wc2026'
import { cn } from '../../utils/cn'

const POSITION_LABEL: Record<WcPosition, string> = {
  GK: 'Gardiens',
  DF: 'Défenseurs',
  MF: 'Milieux',
  FW: 'Attaquants',
}

const POSITION_ORDER: WcPosition[] = ['GK', 'DF', 'MF', 'FW']

/**
 * Affiche l'effectif officiel d'une sélection. Si la liste est vide
 * (avant publication), on montre un état d'attente clair.
 */
export function NationSquadList({
  squad,
  loading = false,
  className,
}: {
  squad: WcSquad | null
  loading?: boolean
  className?: string
}) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-6 text-center text-xs text-tf-app-muted shadow-tf-elev-1',
          className,
        )}
      >
        <p className="font-bold text-tf-app-fg">Chargement de l&apos;effectif…</p>
      </div>
    )
  }

  if (!squad || squad.players.length === 0) {
    return (
      <div
        className={cn(
          'rounded-tf-xl border border-dashed border-tf-c30-border bg-tf-c30-surface p-6 text-center text-xs text-tf-app-muted shadow-tf-elev-1',
          className,
        )}
      >
        <p className="font-display text-base font-black uppercase tracking-[0.18em] text-tf-cdm-gold">
          Effectif à venir
        </p>
        <p className="mt-2">
          La liste officielle des 26 joueurs sera publiée par la fédération
          quelques semaines avant le coup d'envoi.
        </p>
      </div>
    )
  }

  const byPos = squad.players.reduce(
    (acc, p) => {
      ;(acc[p.position] = acc[p.position] || []).push(p)
      return acc
    },
    {} as Record<WcPosition, WcPlayer[]>,
  )

  return (
    <section
      className={cn(
        'space-y-3 rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-4 shadow-tf-elev-1',
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <p className="font-display text-sm font-black uppercase tracking-[0.18em] text-tf-app-fg">
          Effectif officiel ({squad.players.length})
        </p>
        {squad.coach ? (
          <p className="text-[10px] font-bold uppercase tracking-wider text-tf-cdm-gold">
            Sélectionneur · {squad.coach.name}
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {POSITION_ORDER.map((pos) => {
          const list = byPos[pos]
          if (!list || list.length === 0) return null
          return (
            <div key={pos} className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-tf-cdm-gold">
                {POSITION_LABEL[pos]}
              </p>
              <ul className="space-y-1">
                {list
                  .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99))
                  .map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tf-cdm-gold/15 text-[10px] font-black tabular-nums text-tf-cdm-gold">
                          {player.shirtNumber ?? '—'}
                        </span>
                        <span className="truncate font-bold text-tf-app-fg">
                          {player.name}
                          {player.captain ? (
                            <span className="ml-1 text-[10px] font-black tracking-wider text-tf-cdm-gold">
                              ★ Cap.
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="truncate text-[10px] text-tf-app-muted">{player.club ?? ''}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
