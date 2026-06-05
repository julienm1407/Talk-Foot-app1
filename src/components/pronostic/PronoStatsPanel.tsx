import { useBettingHubStats } from '../../hooks/useBettingHubStats'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        L
          ? 'border-tf-dark/10 bg-tf-dark/[0.04]'
          : 'border-white/12 bg-white/[0.06]',
      )}
    >
      <div className="text-[10px] font-black uppercase tracking-wide text-tf-app-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-black tabular-nums tracking-tight text-tf-app-fg">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-tf-app-muted">{hint}</div>
    </div>
  )
}

/** Stats paris réels — page Pronostic (onglet classement). */
export function PronoStatsPanel({ className }: { className?: string }) {
  const stats = useBettingHubStats()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <section
      id="stats-pronos"
      className={cn(
        'scroll-mt-4 space-y-4 border-t pt-5 sm:pt-6',
        L ? 'border-tf-dark/10' : 'border-white/12',
        className,
      )}
      aria-labelledby="prono-stats-heading"
    >
      <h2
        className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted"
        id="prono-stats-heading"
      >
        MES STATS PRONOS
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Stat label="Paris" value={`${stats.total}`} hint="Au total" />
        <Stat
          label="Précision"
          value={`${stats.accuracy}%`}
          hint={stats.decided > 0 ? `${stats.won}/${stats.decided} gagnés` : 'Aucun pari validé'}
        />
        <Stat label="Série" value={`x${stats.streak}`} hint="Gains d’affilée" />
        <Stat label="Gains nets" value={`${stats.points}`} hint="Jetons gagnés (validés)" />
      </div>
    </section>
  )
}
