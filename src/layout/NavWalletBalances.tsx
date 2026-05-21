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

export function NavWalletBalances({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const { wallet } = useWallet()
  const L = appearance === 'light'
  const tokens = formatBalance(wallet.tokens)
  const medals = formatBalance(wallet.medals)

  const pill = cn(
    'inline-flex min-w-0 items-center gap-1 rounded-xl border px-1.5 py-1 transition sm:gap-1.5 sm:px-2 sm:py-1.5',
    L
      ? 'border-tf-dark/12 bg-white/95 text-tf-dark shadow-sm hover:border-tf-dark/22 hover:bg-white'
      : 'border-white/15 bg-white/[0.08] text-white hover:border-white/25 hover:bg-white/[0.12]',
  )

  const label = cn(
    'text-[8px] font-black uppercase leading-none tracking-wide max-[479px]:sr-only min-[480px]:text-[9px]',
    L ? 'text-tf-grey/80' : 'text-sky-200/75',
  )

  const value = cn(
    'text-[13px] font-black tabular-nums leading-none sm:text-sm min-[700px]:text-[15px]',
  )

  return (
    <div
      className={cn('flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5', className)}
      aria-label={`${wallet.tokens} jetons, ${wallet.medals} médailles`}
    >
      <Link
        to="/profile#monnaie"
        className={pill}
        title={`${wallet.tokens} jetons — paris et animations`}
      >
        <TokenGlyph className="size-4 shrink-0 sm:size-[1.125rem]" variant={L ? 'solid' : 'onDark'} />
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className={label}>Jetons</span>
          <span className={value}>{tokens}</span>
        </span>
      </Link>
      <Link
        to="/profile#monnaie"
        className={pill}
        title={`${wallet.medals} médailles — boutique`}
      >
        <span className="text-sm leading-none sm:text-base" aria-hidden>
          🏅
        </span>
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className={label}>Médailles</span>
          <span className={value}>{medals}</span>
        </span>
      </Link>
    </div>
  )
}
