import { Badge } from '../ui/Badge'
import { DisplayNameEditor } from '../profile/DisplayNameEditor'
import { usePronoStats } from '../../hooks/usePronoStats'
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
          ? 'border-tf-dark/10 bg-tf-dark/[0.03]'
          : 'border-white/10 bg-white/[0.05]',
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

/** Stats pronos + pseudo modifiable — hub Pronostic uniquement. */
export function PronoStatsPanel() {
  const { stats, badges } = usePronoStats()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <section
      id="stats-pronos"
      className={cn(
        'scroll-mt-4 rounded-2xl border p-4 sm:p-5',
        L
          ? 'border-tf-dark/12 bg-white shadow-sm'
          : 'border-white/12 bg-[#0d2135]/90 shadow-tf-elev-2',
      )}
      aria-labelledby="prono-stats-heading"
    >
      <div className="mb-4 text-[11px] font-black tracking-[0.18em] text-tf-app-muted" id="prono-stats-heading">
        PRÉDICTIONS
      </div>

      <DisplayNameEditor />

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {badges.slice(0, 2).map((b) => (
            <Badge
              key={b.label}
              tone={b.tone ?? 'neutral'}
              className={b.className}
              title={b.hint}
            >
              {b.label}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Stat label="Pronos" value={`${stats.total}`} hint="Au total" />
        <Stat
          label="Précision"
          value={`${stats.accuracy}%`}
          hint={`${stats.won}/${stats.decided} validés`}
        />
        <Stat label="Série" value={`x${stats.streak}`} hint="Victoires d’affilée" />
        <Stat label="Points" value={`${stats.points}`} hint="Score pronos" />
      </div>
    </section>
  )
}
