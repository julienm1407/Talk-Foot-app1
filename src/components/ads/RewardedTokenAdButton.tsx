import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { useRewardedTokenAd } from '../../hooks/useRewardedTokenAd'

export function RewardedTokenAdButton({ className }: { className?: string }) {
  const { watch, busy, hint, remaining, amount, native } = useRewardedTokenAd()

  return (
    <div className={cn('space-y-1', className)}>
      <button
        type="button"
        onClick={() => void watch()}
        disabled={busy || remaining <= 0}
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex min-h-11 w-full items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-black transition',
          'border-emerald-300/50 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {busy ? 'Chargement de la pub…' : `Regarder une pub · +${amount} jetons`}
      </button>
      <p className="text-[11px] font-semibold text-white/70">
        {hint ??
          (remaining <= 0
            ? 'Plus de pubs récompensées aujourd’hui.'
            : native
              ? `${remaining} restantes aujourd’hui · tu dois aller jusqu’au bout.`
              : 'Dispo dans l’app Android (Play Store), pas sur le site.')}
      </p>
    </div>
  )
}
