import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { useAuth } from '../contexts/AuthContext'
import { useAppearance } from '../contexts/AppearanceContext'
import { useWallet } from '../hooks/useWallet'
import { canUseWalletRewards } from '../utils/walletAuth'
import { cn } from '../utils/cn'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

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
  const { user } = useAuth()
  const { appearance } = useAppearance()
  const { wallet, dailyBonus, claimDailyTokenBonus } = useWallet()
  const rewardsEnabled = canUseWalletRewards(user)
  const [claimHint, setClaimHint] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
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

  const dailyPendingMobile =
    rewardsEnabled && !dailyBonus.alreadyClaimedToday && !dailyBonus.canClaim

  const runClaim = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      const r = await claimDailyTokenBonus()
      if (r.ok) setClaimHint(`+${r.amount}`)
      else if (r.reason === 'already_claimed') setClaimHint('OK')
      else if (r.reason === 'not_open_yet') setClaimHint('10h')
      else setClaimHint('!')
      window.setTimeout(() => setClaimHint(null), 2800)
    } finally {
      setClaiming(false)
    }
  }

  const balanceRow = (
    <>
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
    </>
  )

  if (compact) {
    return (
      <div className="relative z-[1] inline-flex max-w-[min(100%,14rem)] flex-col items-end gap-0.5">
        {/* Mobile : bonus récupérable */}
        {rewardsEnabled && dailyBonus.canClaim ? (
          <button
            type="button"
            onClick={() => void runClaim()}
            disabled={claiming}
            className={cn(
              TF_FOCUS_VISIBLE,
              'tf-interactive-press lg:hidden',
              'inline-flex min-h-tf-touch max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1.5',
              'border-emerald-400/45 bg-emerald-500/20 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
              'ring-1 ring-emerald-400/35 active:scale-[0.98]',
              claiming && 'opacity-70',
            )}
            aria-label={`Récupérer ${dailyBonus.amount} jetons quotidiens`}
          >
            <TokenGlyph className="size-4 shrink-0" variant="onDark" />
            <span className="truncate text-[11px] font-black leading-tight">
              {claiming ? '…' : `Récup. +${dailyBonus.amount}`}
            </span>
          </button>
        ) : dailyPendingMobile ? (
          <Link
            to="/profile#monnaie"
            className={cn(
              shell,
              'lg:hidden gap-1.5 px-2 py-1',
              L
                ? 'border-amber-300/50 bg-amber-50/95 text-amber-950'
                : 'border-amber-400/35 bg-amber-500/12 text-amber-100',
            )}
            title={`Bonus +${dailyBonus.amount} jetons disponible à 10h`}
            aria-label={`Jetons quotidiens : +${dailyBonus.amount} à 10h`}
          >
            <TokenGlyph className="size-3.5 shrink-0" variant={L ? 'solid' : 'onDark'} />
            <span className="truncate text-[10px] font-black leading-tight">+{dailyBonus.amount} à 10h</span>
          </Link>
        ) : null}

        <Link
          to="/profile#monnaie"
          className={cn(
            shell,
            'gap-2 px-2 py-1 sm:gap-2.5 sm:px-2.5 sm:py-1.5',
            rewardsEnabled && (dailyBonus.canClaim || dailyPendingMobile)
              ? 'hidden lg:inline-flex'
              : 'inline-flex',
          )}
          title={`${wallet.tokens} jetons · ${wallet.medals} médailles`}
          aria-label={`${wallet.tokens} jetons, ${wallet.medals} médailles`}
        >
          {balanceRow}
        </Link>

        {claimHint ? (
          <span
            role="status"
            className={cn(
              'pointer-events-none absolute right-0 top-full z-50 mt-1 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-black shadow-md lg:hidden',
              claimHint.startsWith('+')
                ? 'bg-emerald-600 text-white'
                : L
                  ? 'bg-tf-dark text-white'
                  : 'bg-white/15 text-white ring-1 ring-white/20',
            )}
          >
            {claimHint.startsWith('+') ? `${claimHint} jetons !` : claimHint === '10h' ? 'Ouverture à 10h' : claimHint === '!' ? 'Échec — réessaie' : 'Déjà récupéré'}
          </span>
        ) : null}
      </div>
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
