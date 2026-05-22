import { Link } from 'react-router-dom'
import { useUserBets } from '../../hooks/useUserBets'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

/** Raccourci vers la page Pronostic (paris en cours + validés). */
export function MesParisEncart({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [bets] = useUserBets()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const open = bets.filter((b) => b.status === 'open').length
  const settled = bets.filter((b) => b.status !== 'open').length

  return (
    <Link
      to="/pronostic"
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 outline-none transition',
        TF_FOCUS_VISIBLE,
        compact ? 'py-2' : 'py-2.5',
        L
          ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300'
          : 'border-emerald-400/35 bg-emerald-950/30 hover:border-emerald-400/50',
        className,
      )}
      aria-label={`Mes paris — ${open} en cours, ${settled} validés`}
    >
      <div className="min-w-0 text-left">
        <p
          className={cn(
            'text-[10px] font-black uppercase tracking-[0.16em]',
            L ? 'text-emerald-800/80' : 'text-emerald-200/90',
          )}
        >
          Mes paris
        </p>
        <p className="mt-0.5 text-sm font-black text-tf-app-fg">
          {open > 0 || settled > 0 ? (
            <>
              <span className="tabular-nums">{open}</span> en cours
              <span className="mx-1 font-semibold opacity-50">·</span>
              <span className="tabular-nums">{settled}</span> validés
            </>
          ) : (
            <span className="text-xs font-bold text-tf-app-muted">Aucun pour l’instant — parie sur un live</span>
          )}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums',
          L ? 'bg-emerald-600 text-white' : 'bg-emerald-500/90 text-emerald-950',
        )}
      >
        {open + settled > 0 ? open + settled : '→'}
      </span>
    </Link>
  )
}
