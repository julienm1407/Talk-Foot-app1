import { TRENDING_SEARCH_12H } from '../../data/trendingSearch12h'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

/**
 * Suggestions de recherche basées sur les tendances 12h (hub desktop).
 * Clic → déclenche `onSelect(term)` (ex. remplir la barre de recherche).
 */
export function SearchTrends12h({
  onSelect,
  className,
  maxTerms = 3,
}: {
  onSelect: (term: string) => void
  className?: string
  /** Hub : 3 max, sans zone scroll (voir données `trendingSearch12h`) */
  maxTerms?: number
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const terms = TRENDING_SEARCH_12H.slice(0, maxTerms)

  return (
    <div
      className={cn('min-w-0', className)}
      role="group"
      aria-label="Recherches tendance sur les 12 dernières heures"
    >
      {/* Libellé + pastilles : colonne (md–lg), une ligne dès lg ; pastilles jamais en flex-nowrap. */}
      <div className="flex w-full min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2.5">
        <p
          className={cn(
            'w-full min-w-0 shrink-0 text-[9px] font-black uppercase tracking-[0.14em] lg:w-auto',
            L ? 'text-tf-dark/60' : 'text-sky-200/80',
          )}
        >
          Tendances · 12h
        </p>
        <ul className="flex w-full min-w-0 min-h-0 flex-1 flex-wrap content-start items-center gap-1.5 sm:gap-2">
          {terms.map((t) => {
            const heatW = Math.max(16, Math.round(16 + (t.heat / 100) * 32))
            return (
              <li key={t.term} className="max-w-full shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(t.term)}
                  className={cn(
                    'tf-interactive-press max-w-full truncate whitespace-nowrap rounded-full border px-2.5 py-1 text-left text-[11px] font-bold leading-tight transition',
                    TF_FOCUS_VISIBLE,
                    L
                      ? 'border-tf-dark/10 bg-gradient-to-b from-white to-tf-ice/90 text-tf-dark shadow-sm hover:border-tf-dark/18 hover:bg-white'
                      : 'border-white/12 bg-[color:var(--tf-c30-surface)]/90 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/24 hover:bg-[color:var(--tf-c30-surface-soft)]/95',
                  )}
                  title={`Rechercher « ${t.term} »`}
                >
                  <span className="mr-1 inline-block align-middle" aria-hidden>
                    <span
                      className="inline-block h-1.5 rounded-full bg-gradient-to-r from-rose-500/90 to-amber-400/90"
                      style={{ width: `${heatW}px` }}
                    />
                  </span>
                  <span className="align-middle">{t.term}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
