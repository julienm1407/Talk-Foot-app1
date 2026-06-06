import { Link } from 'react-router-dom'
import { useUserBets } from '../../hooks/useUserBets'
import { useWallet } from '../../hooks/useWallet'
import { useAppearance } from '../../contexts/AppearanceContext'
import { getAppSectionTheme } from '../../theme/appSectionThemes'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

const pronoTheme = getAppSectionTheme('pronostic')

/** Raccourci vers la page Pronostic (paris en cours + validés). */
export function MesParisEncart({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [bets] = useUserBets()
  const { wallet } = useWallet()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const open = bets.filter((b) => b.status === 'open').length
  const settled = bets.filter((b) => b.status !== 'open').length
  const total = open + settled
  const tokens = Math.round(wallet.tokens)

  const detailLine =
    total > 0 ? (
      <>
        {open > 0 ? (
          <span className={cn('font-black tabular-nums', L ? 'text-emerald-700' : 'text-emerald-300')}>
            {open} en cours
          </span>
        ) : null}
        {open > 0 && settled > 0 ? <span className="opacity-45"> · </span> : null}
        {settled > 0 ? (
          <span className="tabular-nums">
            {settled} validé{settled > 1 ? 's' : ''}
          </span>
        ) : null}
      </>
    ) : (
      <span>
        <span className={cn('font-black tabular-nums', L ? 'text-emerald-700' : 'text-emerald-300')}>
          {tokens.toLocaleString('fr-FR')} jetons
        </span>
        <span className="opacity-45"> · pronos</span>
      </span>
    )

  const compactDetail =
    open > 0 ? (
      <span className={cn('font-black tabular-nums', L ? 'text-emerald-700' : 'text-emerald-300')}>
        {open} en cours
      </span>
    ) : settled > 0 ? (
      <span className="tabular-nums">
        {settled} validé{settled > 1 ? 's' : ''}
      </span>
    ) : (
      <span>
        <span className={cn('font-black tabular-nums', L ? 'text-emerald-700' : 'text-emerald-300')}>
          {tokens.toLocaleString('fr-FR')} jetons
        </span>
        <span className="opacity-45"> · pronos</span>
      </span>
    )

  return (
    <Link
      to="/pronostic"
      className={cn(
        'group relative flex flex-col outline-none transition',
        compact ? 'overflow-visible' : 'overflow-hidden',
        TF_FOCUS_VISIBLE,
        compact
          ? cn(
              'rounded-xl border',
              L
                ? 'border-tf-cta/30 bg-white hover:border-tf-cta/45 hover:bg-tf-cta/[0.04] shadow-sm'
                : 'border-tf-cta/30 bg-gradient-to-br from-[#0d2135]/95 to-[#061018]/90 hover:border-tf-cta/45',
            )
          : cn(
              'rounded-xl border',
              L
                ? 'border-tf-cta/25 bg-gradient-to-br from-emerald-50/80 via-white to-tf-cta/[0.05] hover:border-tf-cta/40'
                : 'border-tf-cta/35 bg-gradient-to-br from-emerald-950/25 to-[#0d2135]/90 hover:border-tf-cta/50',
            ),
        className,
      )}
      aria-label={
        total > 0
          ? `Mes paris — ${open} en cours, ${settled} validés, ${tokens} jetons`
          : `Mes paris — ${tokens} jetons`
      }
    >
      <span className={cn('block w-full shrink-0', pronoTheme.shellStripe)} aria-hidden />
      {compact ? (
        <div className="flex w-full min-w-0 items-start gap-2 px-2.5 py-2.5">
          <span
            className={cn(
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-base leading-none',
              L ? 'bg-tf-cta/12 ring-1 ring-tf-cta/20' : 'bg-tf-cta/20 ring-1 ring-tf-cta/35',
            )}
            aria-hidden
          >
            🎯
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-black leading-tight text-tf-app-fg">Mes paris</p>
            <p
              className={cn(
                'mt-0.5 text-[10px] font-semibold leading-snug',
                L ? 'text-tf-dark/78' : 'text-sky-200/85',
              )}
            >
              {compactDetail}
            </p>
          </div>
          <span
            className={cn(
              'mt-0.5 shrink-0 text-base font-black leading-none transition group-hover:translate-x-0.5',
              L ? 'text-tf-cta' : 'text-red-300',
            )}
            aria-hidden
          >
            ›
          </span>
        </div>
      ) : (
        <div className="flex w-full min-w-0 items-center gap-2 px-2.5 py-2.5">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg text-base leading-none',
              L ? 'bg-tf-cta/12 ring-1 ring-tf-cta/20' : 'bg-tf-cta/20 ring-1 ring-tf-cta/35',
            )}
            aria-hidden
          >
            🎯
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.14em]',
                L ? 'text-tf-cta' : 'text-red-300',
              )}
            >
              Pronostic
            </p>
            <p className="truncate text-sm font-black leading-tight text-tf-app-fg">Mes paris</p>
            <p
              className={cn(
                'truncate text-[10px] font-semibold leading-snug',
                L ? 'text-tf-dark/78' : 'text-sky-200/85',
              )}
            >
              {detailLine}
            </p>
          </div>
          {open > 0 ? (
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                L ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-emerald-950',
              )}
            >
              {open}
            </span>
          ) : (
            <span
              className={cn(
                'shrink-0 text-base font-black leading-none transition group-hover:translate-x-0.5',
                L ? 'text-tf-cta' : 'text-red-300',
              )}
              aria-hidden
            >
              ›
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
