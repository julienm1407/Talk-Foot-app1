import { useState } from 'react'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useWallet } from '../../hooks/useWallet'
import { TokenGlyph } from '../ui/TokenGlyph'
import { cn } from '../../utils/cn'

type Props = {
  /** Bandeau compact (rail étroit) ou carte plus lisible (mobile / drawer). */
  variant?: 'compact' | 'prominent'
  className?: string
}

/**
 * Récompense jetons quotidienne (10h) — à placer en haut sur mobile pour rester visible.
 */
export function DailyTokenBonusCard({ variant = 'compact', className }: Props) {
  const { appearance } = useAppearance()
  const { wallet, claimDailyTokenBonus, dailyBonus } = useWallet()
  const [dailyClaimHint, setDailyClaimHint] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const L = appearance === 'light'
  const prominent = variant === 'prominent'

  const hubCaps = L ? 'text-tf-dark/82' : 'text-sky-100'
  const hubSecondary = L ? 'text-tf-dark/72' : 'text-sky-200/95'

  return (
    <section
      className={cn(className)}
      aria-labelledby="daily-token-bonus-title"
    >
      <p
        id="daily-token-bonus-title"
        className={cn(
          'font-black uppercase tracking-[0.16em] text-tf-app-fg',
          prominent ? 'text-[11px] tracking-[0.18em]' : 'px-1 text-[9px]',
          hubCaps,
        )}
      >
        {prominent ? 'Jetons quotidiens' : 'Récompense quotidienne'}
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
            <p className={cn('font-black text-tf-app-fg', prominent ? 'text-sm' : 'text-[10px]')}>
              +{dailyBonus.amount} jetons
              <span className={cn('font-bold', hubSecondary)}> · s&apos;ajoutent à ton solde</span>
            </p>
            <p className={cn('mt-0.5 font-semibold tabular-nums', prominent ? 'text-xs' : 'text-[9px]', hubSecondary)}>
              Solde actuel : {wallet.tokens.toLocaleString('fr-FR')} jetons
            </p>
            {prominent && dailyBonus.canClaim ? (
              <p className={cn('mt-0.5 text-xs font-semibold', hubSecondary)}>
                Bonus du jour (10h) — cumulatif, ton solde ne repart pas à zéro.
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className={cn(
            'mt-2.5 w-full rounded-lg font-black transition',
            prominent ? 'px-3 py-2.5 text-sm' : 'rounded-md px-2 py-1.5 text-[10px]',
            dailyBonus.canClaim
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : L
                ? 'bg-slate-200 text-slate-600'
                : 'bg-white/15 text-white/70',
          )}
          disabled={!dailyBonus.canClaim || claiming}
          onClick={() => {
            void (async () => {
              if (claiming) return
              setClaiming(true)
              try {
                const r = await claimDailyTokenBonus()
                if (r.ok) setDailyClaimHint(`+${r.amount} jetons récupérés !`)
                else if (r.reason === 'already_claimed') setDailyClaimHint('Déjà récupéré pour cette journée.')
                else if (r.reason === 'not_open_yet') setDailyClaimHint('Le bonus ouvre tous les jours à 10h.')
                else setDailyClaimHint('Impossible pour le moment.')
                window.setTimeout(() => setDailyClaimHint(null), 3200)
              } finally {
                setClaiming(false)
              }
            })()
          }}
        >
          {claiming
            ? 'Récupération…'
            : dailyBonus.canClaim
              ? 'Récupérer mes jetons'
              : dailyBonus.alreadyClaimedToday
                ? 'Déjà récupéré'
                : 'À 10h'}
        </button>
        {dailyClaimHint ? (
          <p
            className={cn(
              'mt-1.5 font-bold leading-snug',
              prominent ? 'text-xs' : 'text-[9px]',
              dailyBonus.alreadyClaimedToday || dailyClaimHint.startsWith('+')
                ? 'text-emerald-700'
                : hubSecondary,
            )}
          >
            {dailyClaimHint}
          </p>
        ) : null}
      </div>
    </section>
  )
}
