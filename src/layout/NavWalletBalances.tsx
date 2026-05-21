import { Link } from 'react-router-dom'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { useAppearance } from '../contexts/AppearanceContext'
import { useWallet } from '../hooks/useWallet'
import { cn } from '../utils/cn'

function formatBalance(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0'
  if (n >= 10_000) return `${Math.floor(n / 1000)}k`
  return String(Math.round(n))
}

/** Jetons + médailles — pastille compacte pour la barre de navigation. */
export function NavWalletBalances({
  className,
  compact = true,
}: {
  className?: string
  /** Une ligne icône + chiffre (nav). Labels empilés si false. */
  compact?: boolean
}) {
  const { appearance } = useAppearance()
  const { wallet } = useWallet()
  const L = appearance === 'light'
  const tokens = formatBalance(wallet.tokens)
  const medals = formatBalance(wallet.medals)

  const shell = cn(
    'inline-flex shrink-0 items-center rounded-xl border transition',
    L
      ? 'border-tf-dark/12 bg-white/95 text-tf-dark shadow-sm hover:border-tf-dark/22 hover:bg-white'
      : 'border-white/15 bg-white/[0.08] text-white hover:border-white/25 hover:bg-white/[0.12]',
    className,
  )

  const divider = cn('h-4 w-px shrink-0 sm:h-5', L ? 'bg-tf-dark/12' : 'bg-white/20')

  const value = 'text-[13px] font-black tabular-nums leading-none sm:text-sm'

  if (compact) {
    return (
      <Link
        to="/profile#monnaie"
        className={cn(shell, 'gap-2 px-2 py-1 sm:gap-2.5 sm:px-2.5 sm:py-1.5')}
        title={`${wallet.tokens} jetons · ${wallet.medals} médailles`}
        aria-label={`${wallet.tokens} jetons, ${wallet.medals} médailles`}
      >
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <TokenGlyph className="size-4 shrink-0" variant={L ? 'solid' : 'onDark'} />
          <span className={value}>{tokens}</span>
        </span>
        <span className={divider} aria-hidden />
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="text-sm leading-none" aria-hidden>
            🏅
          </span>
          <span className={value}>{medals}</span>
        </span>
      </Link>
    )
  }

  return (
    <Link
      to="/profile#monnaie"
      className={cn(shell, 'gap-2 px-2 py-1 sm:gap-2.5 sm:px-2.5 sm:py-1.5')}
      title={`${wallet.tokens} jetons · ${wallet.medals} médailles`}
      aria-label={`${wallet.tokens} jetons, ${wallet.medals} médailles`}
    >
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <TokenGlyph className="size-4 shrink-0 sm:size-[1.125rem]" variant={L ? 'solid' : 'onDark'} />
        <span className="flex flex-col items-start leading-none">
          <span
            className={cn(
              'text-[8px] font-black uppercase tracking-wide sm:text-[9px]',
              L ? 'text-emerald-800/75' : 'text-emerald-200/80',
            )}
          >
            Jetons
          </span>
          <span className={value}>{tokens}</span>
        </span>
      </span>
      <span className={cn(divider, 'h-7 sm:h-8')} aria-hidden />
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span className="text-sm leading-none sm:text-base" aria-hidden>
          🏅
        </span>
        <span className="flex flex-col items-start leading-none">
          <span
            className={cn(
              'text-[8px] font-black uppercase tracking-wide sm:text-[9px]',
              L ? 'text-amber-900/75' : 'text-amber-200/85',
            )}
          >
            Médailles
          </span>
          <span className={value}>{medals}</span>
        </span>
      </span>
    </Link>
  )
}
