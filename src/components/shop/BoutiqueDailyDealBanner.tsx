import { Link } from 'react-router-dom'
import type { BoutiqueDailyDeal } from '../../data/boutiqueDailyDeal'
import { boutiqueTabHrefForItem, getEffectiveTokenCost } from '../../data/boutiqueDailyDeal'
import { TokenGlyph } from '../ui/TokenGlyph'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export function BoutiqueDailyDealBanner({ deal }: { deal: BoutiqueDailyDeal }) {
  const { item, originalCost, dealCost, discountPercent } = deal
  const tokenCost = getEffectiveTokenCost(item)

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-amber-400/55',
        'bg-gradient-to-br from-amber-950/90 via-violet-950/85 to-[#061a2e] p-4 shadow-[0_16px_48px_rgba(245,158,11,0.18)] sm:p-5',
      )}
      aria-labelledby="boutique-daily-deal-title"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-amber-400/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
            <span aria-hidden>⚡</span>
            Offre du jour
            <span className="text-amber-200/90">· -{discountPercent}%</span>
          </p>
          <h2
            id="boutique-daily-deal-title"
            className="font-display text-lg font-black leading-tight text-white sm:text-xl"
          >
            {item.emoji ? `${item.emoji} ` : null}
            {item.name}
          </h2>
          <p className="text-sm font-semibold text-amber-100/85">
            <span className="text-white/50 line-through tabular-nums">{originalCost} 🏅</span>{' '}
            <span className="text-amber-50 tabular-nums">{dealCost} 🏅</span>
            <span className="text-white/45"> · </span>
            <span className="inline-flex items-center gap-0.5 tabular-nums text-emerald-100/90">
              {tokenCost.toLocaleString('fr-FR')}
              <TokenGlyph variant="onDark" className="size-3.5" />
            </span>
          </p>
          <p className="text-[11px] font-medium text-white/55">
            Nouvelle offre demain à minuit (heure de Paris). Le prix réduit s&apos;applique à l&apos;achat.
          </p>
        </div>
        <Link
          to={`${boutiqueTabHrefForItem(item)}&deal=jour`}
          className={cn(
            TF_FOCUS_VISIBLE,
            'inline-flex shrink-0 items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-amber-950 shadow-md transition hover:bg-amber-300',
          )}
        >
          Voir l&apos;offre
        </Link>
      </div>
    </section>
  )
}
