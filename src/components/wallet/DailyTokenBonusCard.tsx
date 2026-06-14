import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useWallet } from '../../hooks/useWallet'
import { canUseWalletRewards } from '../../utils/walletAuth'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { TokenGlyph } from '../ui/TokenGlyph'
import { cn } from '../../utils/cn'

type Props = {
  /** Bandeau compact (rail étroit) ou carte plus lisible (mobile / drawer). */
  variant?: 'compact' | 'prominent'
  className?: string
}

/** Récompense jetons quotidienne (10h Paris) — solde toujours visible, bouton seulement si récupérable. */
export function DailyTokenBonusCard({ variant = 'compact', className }: Props) {
  const { user } = useAuth()
  const { appearance } = useAppearance()
  const { wallet, claimDailyTokenBonus, dailyBonus } = useWallet()
  const rewardsEnabled = canUseWalletRewards(user)
  const [dailyClaimHint, setDailyClaimHint] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const L = appearance === 'light'
  const prominent = variant === 'prominent'

  const hubCaps = L ? 'text-tf-dark/82' : 'text-sky-100'
  const hubSecondary = L ? 'text-tf-dark/72' : 'text-sky-200/95'

  return (
    <section className={cn(className)} aria-labelledby="daily-token-bonus-title">
      <p
        id="daily-token-bonus-title"
        className={cn(
          'font-black uppercase tracking-[0.16em] text-tf-app-fg',
          prominent ? 'text-[11px] tracking-[0.18em]' : 'px-1 text-[9px]',
          hubCaps,
        )}
      >
        {prominent ? 'Mes jetons' : 'Solde jetons'}
      </p>
      <div
        className={cn(
          'rounded-xl border',
          prominent ? 'mt-2 p-3' : 'mt-1.5 rounded-lg p-2',
          L
            ? 'border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-white'
            : 'border-emerald-400/30 bg-emerald-500/10',
        )}
      >
        <div className="flex items-start gap-2">
          <TokenGlyph className={cn('shrink-0', prominent ? 'mt-0.5 size-5' : 'mt-0.5 size-4')} />
          <div className="min-w-0 flex-1">
            <p className={cn('font-black tabular-nums text-tf-app-fg', prominent ? 'text-lg' : 'text-sm')}>
              {wallet.tokens.toLocaleString('fr-FR')} jetons
            </p>
            <p className={cn('mt-0.5 font-semibold', prominent ? 'text-xs' : 'text-[9px]', hubSecondary)}>
              Bonus quotidien : +{dailyBonus.amount} jetons (à partir de 10h)
            </p>
          </div>
        </div>
        {!rewardsEnabled ? (
          <Link
            to="/login"
            className={cn(
              TF_FOCUS_VISIBLE,
              'mt-2.5 flex w-full items-center justify-center rounded-lg bg-tf-cta font-black text-white transition hover:bg-tf-cta-hover',
              prominent ? 'px-3 py-2.5 text-sm' : 'rounded-md px-2 py-1.5 text-[10px]',
            )}
          >
            Se connecter pour récupérer
          </Link>
        ) : dailyBonus.canClaim ? (
          <button
            type="button"
            className={cn(
              TF_FOCUS_VISIBLE,
              'mt-2.5 w-full rounded-lg bg-emerald-600 font-black text-white transition hover:bg-emerald-700',
              prominent ? 'px-3 py-2.5 text-sm' : 'rounded-md px-2 py-1.5 text-[10px]',
              claiming && 'opacity-70',
            )}
            disabled={claiming}
            onClick={() => {
              void (async () => {
                if (claiming) return
                setClaiming(true)
                try {
                  const r = await claimDailyTokenBonus()
                  if (r.ok) setDailyClaimHint(`+${r.amount} jetons récupérés !`)
                  else if (r.reason === 'already_claimed') setDailyClaimHint('Déjà récupéré pour cette journée.')
                  else if (r.reason === 'login_required') setDailyClaimHint('Connexion requise.')
                  else setDailyClaimHint('Impossible pour le moment.')
                  window.setTimeout(() => setDailyClaimHint(null), 3200)
                } finally {
                  setClaiming(false)
                }
              })()
            }}
          >
            {claiming ? 'Récupération…' : `Récupérer +${dailyBonus.amount} jetons`}
          </button>
        ) : dailyBonus.alreadyClaimedToday ? (
          <p className={cn('mt-2 font-bold text-emerald-700', prominent ? 'text-xs' : 'text-[9px]')}>
            Bonus récupéré aujourd&apos;hui
          </p>
        ) : null}
        {dailyClaimHint ? (
          <p
            className={cn(
              'mt-1.5 font-bold leading-snug',
              prominent ? 'text-xs' : 'text-[9px]',
              dailyClaimHint.startsWith('+') ? 'text-emerald-700' : hubSecondary,
            )}
          >
            {dailyClaimHint}
          </p>
        ) : null}
      </div>
    </section>
  )
}
