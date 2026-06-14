import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { useAuth } from '../contexts/AuthContext'
import { useAppearance } from '../contexts/AppearanceContext'
import { DAILY_TOKEN_BONUS_AMOUNT, useWallet } from '../hooks/useWallet'
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
  dense = false,
}: {
  className?: string
  /** Une ligne icône + chiffre (nav). Labels empilés si false. */
  compact?: boolean
  /** Barre mobile avec bouton Retour — pastille plus compacte. */
  dense?: boolean
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
  const canClaimBonus = rewardsEnabled && dailyBonus.canClaim

  const shell = cn(
    'inline-flex shrink-0 items-center rounded-xl border transition',
    L
      ? 'border-tf-dark/12 bg-white/95 text-tf-dark shadow-sm hover:border-tf-dark/22 hover:bg-white'
      : 'border-white/15 bg-white/[0.08] text-white hover:border-white/25 hover:bg-white/[0.12]',
    className,
  )

  const divider = cn('h-4 w-px shrink-0 sm:h-5', L ? 'bg-tf-dark/12' : 'bg-white/20')
  const value = cn(
    'font-black tabular-nums leading-none',
    dense ? 'text-[11px] sm:text-[13px]' : 'text-[13px] sm:text-sm',
  )

  const runClaim = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      const r = await claimDailyTokenBonus()
      if (r.ok) setClaimHint(`+${r.amount}`)
      else if (r.reason === 'already_claimed') setClaimHint('OK')
      else setClaimHint('!')
      window.setTimeout(() => setClaimHint(null), 2800)
    } finally {
      setClaiming(false)
    }
  }

  const tokenGlyph = (
    <span className="relative inline-flex shrink-0">
      <TokenGlyph className={cn('shrink-0', dense ? 'size-3.5 sm:size-4' : 'size-4')} variant={L ? 'solid' : 'onDark'} />
      {canClaimBonus ? (
        <span
          className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]"
          aria-hidden
        />
      ) : null}
    </span>
  )

  const tokenControl = canClaimBonus ? (
    <button
      type="button"
      onClick={() => void runClaim()}
      disabled={claiming}
      className={cn(
        TF_FOCUS_VISIBLE,
        'tf-interactive-press inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-0.5 -my-0.5',
        'ring-2 ring-emerald-400/50',
        L ? 'ring-offset-1 ring-offset-white/95' : 'ring-offset-0',
        claiming && 'opacity-70',
      )}
      title={`Récupérer +${DAILY_TOKEN_BONUS_AMOUNT} jetons`}
      aria-label={`${wallet.tokens} jetons — récupérer le bonus (+${DAILY_TOKEN_BONUS_AMOUNT})`}
    >
      {tokenGlyph}
      <span className={value}>{tokens}</span>
    </button>
  ) : (
    <Link
      to="/profile#monnaie"
      className="inline-flex items-center gap-1 whitespace-nowrap"
      title={`${wallet.tokens} jetons`}
      aria-label={`${wallet.tokens} jetons`}
    >
      {tokenGlyph}
      <span className={value}>{tokens}</span>
    </Link>
  )

  const medalsControl = (
    <Link
      to="/profile#monnaie"
      className="inline-flex items-center gap-1 whitespace-nowrap"
      title={`${wallet.medals} médailles`}
      aria-label={`${wallet.medals} médailles`}
    >
      <span className={cn('leading-none', dense ? 'text-xs sm:text-sm' : 'text-sm')} aria-hidden>
        🏅
      </span>
      <span className={value}>{medals}</span>
    </Link>
  )

  const claimToast =
    claimHint ? (
      <span
        role="status"
        className={cn(
          'pointer-events-none absolute right-0 top-full z-50 mt-1 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-black shadow-md',
          claimHint.startsWith('+')
            ? 'bg-emerald-600 text-white'
            : L
              ? 'bg-tf-dark text-white'
              : 'bg-white/15 text-white ring-1 ring-white/20',
        )}
      >
        {claimHint.startsWith('+')
          ? `${claimHint} jetons !`
          : claimHint === '!'
            ? 'Échec — réessaie'
            : 'Déjà récupéré'}
      </span>
    ) : null

  if (compact) {
    return (
      <div className="relative z-[1] inline-flex max-w-[min(100%,14rem)] flex-col items-end">
        <div
          className={cn(
            shell,
            'inline-flex',
            dense ? 'gap-1 px-1.5 py-1 sm:gap-2 sm:px-2.5 sm:py-1.5' : 'gap-2 px-2 py-1 sm:gap-2.5 sm:px-2.5 sm:py-1.5',
          )}
          title={`${wallet.tokens} jetons · ${wallet.medals} médailles`}
        >
          {tokenControl}
          <span className={divider} aria-hidden />
          {medalsControl}
        </div>
        {claimToast}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={cn(shell, 'gap-2 px-2 py-1 sm:gap-2.5 sm:px-2.5 sm:py-1.5')}>
        {canClaimBonus ? (
          <button
            type="button"
            onClick={() => void runClaim()}
            disabled={claiming}
            className={cn(
              TF_FOCUS_VISIBLE,
              'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-0.5 ring-2 ring-emerald-400/50',
              L ? 'ring-offset-1 ring-offset-white/95' : 'ring-offset-0',
              claiming && 'opacity-70',
            )}
            title={`Récupérer +${DAILY_TOKEN_BONUS_AMOUNT} jetons`}
            aria-label={`${wallet.tokens} jetons — récupérer le bonus (+${DAILY_TOKEN_BONUS_AMOUNT})`}
          >
            <span className="relative inline-flex shrink-0">
              <TokenGlyph className="size-4 shrink-0 sm:size-[1.125rem]" variant={L ? 'solid' : 'onDark'} />
              <span
                className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]"
                aria-hidden
              />
            </span>
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
          </button>
        ) : (
          <Link
            to="/profile#monnaie"
            className="inline-flex items-center gap-1 whitespace-nowrap"
            title={`${wallet.tokens} jetons`}
          >
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
          </Link>
        )}
        <span className={cn(divider, 'h-7 sm:h-8')} aria-hidden />
        <Link
          to="/profile#monnaie"
          className="inline-flex items-center gap-1 whitespace-nowrap"
          title={`${wallet.medals} médailles`}
        >
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
        </Link>
      </div>
      {claimToast}
    </div>
  )
}
