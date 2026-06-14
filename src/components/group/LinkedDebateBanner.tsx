import { Link } from 'react-router-dom'
import type { Debate } from '../../data/debates'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'

type Props = {
  debate: Debate
  debateId: string | null
  /** Bandeau une ligne dans le fil tribune — laisse plus de place au chat. */
  compact?: boolean
  className?: string
}

/** Bandeau « Débat lié » lisible (clair / sombre), sans dégradé à faible contraste. */
export function LinkedDebateBanner({ debate, debateId, compact = false, className }: Props) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const accent = debate.accent?.trim() || '#6366f1'

  return (
    <div
      className={cn(
        'rounded-2xl border-l-[4px] shadow-sm',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        L
          ? 'border border-tf-dark/12 bg-white ring-1 ring-tf-dark/8'
          : 'border border-white/15 bg-slate-950/90 ring-1 ring-white/10',
        className,
      )}
      style={{ borderLeftColor: accent }}
    >
      <p
        className={cn(
          'text-[10px] font-black uppercase tracking-[0.18em]',
          L ? 'text-tf-app-muted' : 'text-sky-200/85',
        )}
      >
        Débat lié
      </p>
      <p
        className={cn(
          'mt-1 text-sm font-black leading-snug sm:text-base',
          L ? 'text-tf-app-fg' : 'text-white',
        )}
      >
        {debate.title}
      </p>
      {debate.excerpt?.trim() && !compact ? (
        <p
          className={cn(
            'mt-1.5 text-xs font-semibold leading-relaxed sm:text-sm',
            L ? 'text-tf-app-muted' : 'text-sky-100/90',
          )}
        >
          {debate.excerpt}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {debateId ? (
          <Link
            to={`/debate/${debateId}`}
            className={cn(
              'text-xs font-bold underline-offset-2 hover:underline',
              L ? 'text-tf-cta' : 'text-sky-300',
            )}
          >
            Participer sur la page débat
          </Link>
        ) : null}
        <span
          className={cn(
            'text-xs font-semibold',
            L ? 'text-tf-app-muted' : 'text-sky-200/75',
          )}
        >
          {debateId ? '· ' : ''}
          Accès ouvert — aucune adhésion à la tribune requise
        </span>
      </div>
    </div>
  )
}
