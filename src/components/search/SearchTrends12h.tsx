import { TRENDING_HASHTAGS } from '../../data/trendingHashtags'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

function hashtagLabel(tag: string) {
  const t = tag.trim()
  if (!t) return '#'
  return t.startsWith('#') ? t : `#${t}`
}

function hashtagQuery(tag: string) {
  const t = tag.trim().replace(/^#+/, '')
  return t ? `#${t}` : '#'
}

/**
 * Hashtags sous la barre de recherche (hub desktop).
 * Clic → `onSelect` avec la requête « #Tag » (≥ 2 caractères pour ouvrir la recherche).
 */
export function SearchTrends12h({
  onSelect,
  className,
  maxTerms = 3,
}: {
  onSelect: (term: string) => void
  className?: string
  /** Hub : 3 max */
  maxTerms?: number
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const items = TRENDING_HASHTAGS.slice(0, maxTerms)

  return (
    <div
      className={cn('min-w-0', className)}
      role="group"
      aria-label="Hashtags populaires"
    >
      <div className="flex w-full min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2.5">
        <p
          className={cn(
            'w-full min-w-0 shrink-0 text-[9px] font-black uppercase tracking-[0.14em] lg:w-auto',
            L ? 'text-tf-dark/60' : 'text-sky-200/80',
          )}
        >
          Hashtags
        </p>
        <ul className="flex w-full min-w-0 min-h-0 flex-1 flex-wrap content-start items-center gap-1.5 sm:gap-2">
          {items.map((h) => {
            const label = hashtagLabel(h.tag)
            const heatW = Math.max(16, Math.round(16 + (h.heat / 100) * 32))
            return (
              <li key={h.tag} className="max-w-full shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(hashtagQuery(h.tag))}
                  className={cn(
                    'tf-interactive-press max-w-full truncate whitespace-nowrap rounded-full border px-2.5 py-1 text-left text-[11px] font-bold leading-tight transition',
                    TF_FOCUS_VISIBLE,
                    L
                      ? 'border-tf-electric/20 bg-gradient-to-b from-sky-50/90 to-white text-tf-dark shadow-sm hover:border-tf-electric/35 hover:bg-white'
                      : 'border-sky-400/25 bg-[color:var(--tf-c30-surface)]/90 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-sky-300/40 hover:bg-[color:var(--tf-c30-surface-soft)]/95',
                  )}
                  title={`Rechercher ${label}`}
                >
                  <span className="mr-1 inline-block align-middle" aria-hidden>
                    <span
                      className="inline-block h-1.5 rounded-full bg-gradient-to-r from-sky-500/90 to-violet-500/85"
                      style={{ width: `${heatW}px` }}
                    />
                  </span>
                  <span className="align-middle font-black tracking-tight text-sky-700 dark:text-sky-200">
                    {label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
