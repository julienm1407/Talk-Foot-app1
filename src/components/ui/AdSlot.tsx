import { Card } from './Card'
import { AdsenseDisplayUnit } from '../ads/AdsenseDisplayUnit'
import { getLiveAdsenseUnit } from '../../config/ads'
import { cn } from '../../utils/cn'

export function AdSlot({
  title = 'Publicité',
  brand = 'Talk Foot',
  body = 'Emplacement publicitaire (mock).',
  tone = 'blue',
  imageSeed = 'ad',
  compact,
  /** Colonne latérale type skyscraper (desktop). */
  variant = 'default',
  className,
}: {
  title?: string
  brand?: string
  body?: string
  tone?: 'blue' | 'navy' | 'sky'
  imageSeed?: string
  compact?: boolean
  variant?: 'default' | 'rail'
  className?: string
}) {
  const placementKey = imageSeed
  const live = getLiveAdsenseUnit(placementKey)

  const gradient =
    tone === 'navy'
      ? 'from-[#0b1b3a]/12 via-white/70 to-white/80'
      : tone === 'sky'
        ? 'from-sky-400/18 via-white/70 to-white/80'
        : 'from-blue-600/14 via-white/70 to-white/80'

  if (live && variant === 'rail') {
    return (
      <div
        role="complementary"
        className={cn('overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm', className)}
        aria-label="Publicité"
      >
        <AdsenseDisplayUnit
          client={live.client}
          slot={live.slot}
          format="vertical"
          className="min-h-[280px] w-full max-w-full"
        />
      </div>
    )
  }

  if (live) {
    return (
      <Card elevation="none" className={cn('overflow-hidden', className)}>
        <AdsenseDisplayUnit
          client={live.client}
          slot={live.slot}
          format={compact ? 'horizontal' : 'rectangle'}
          className={cn('w-full max-w-full', compact ? 'min-h-[72px]' : 'min-h-[100px]')}
        />
      </Card>
    )
  }

  if (variant === 'rail') {
    return (
      <div
        role="complementary"
        className={cn('overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm', className)}
        aria-label={title}
      >
        <div className={cn('bg-gradient-to-b', gradient)}>
          <div className="relative aspect-[3/5] w-full min-h-[200px] max-h-[min(52vh,420px)] overflow-hidden">
            <img
              src={`https://picsum.photos/seed/${imageSeed}/300/500`}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="border-t border-slate-200/60 px-2.5 py-2">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <div className="text-[8px] font-black uppercase tracking-wide text-slate-500">
                  {title}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[10px] font-black leading-tight text-slate-900">
                  {brand}
                </div>
              </div>
              <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[8px] font-bold text-slate-500">
                Ad
              </span>
            </div>
            <p className="mt-1 line-clamp-3 text-[9px] font-semibold leading-snug text-slate-600">
              {body}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card elevation="none" className={cn('overflow-hidden', className)}>
      <div className={`bg-gradient-to-br ${gradient}`}>
        <div
          className={cn(
            'relative w-full overflow-hidden',
            compact ? 'h-14 sm:h-16' : 'h-24 sm:h-28',
          )}
        >
          <img
            src={`https://picsum.photos/seed/${imageSeed}/480/160`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className={cn(compact ? 'px-3 py-2.5' : 'px-5 py-4')}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div
                className={cn(
                  'font-black tracking-wide text-slate-600',
                  compact ? 'text-[9px]' : 'text-[11px]',
                )}
              >
                {title.toUpperCase()}
              </div>
              <div
                className={cn('font-black text-slate-900', compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm')}
              >
                {brand}
              </div>
            </div>
            <div
              className={cn(
                'shrink-0 rounded-full border border-slate-200 bg-white/80 font-semibold text-slate-600',
                compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]',
              )}
            >
              Ad
            </div>
          </div>
          <div
            className={cn(
              'font-semibold text-slate-600',
              compact ? 'mt-1 line-clamp-2 text-[10px] leading-snug' : 'mt-2 text-xs',
            )}
          >
            {body}
          </div>
          {!compact ? (
            <div className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-slate-900 ring-1 ring-slate-200 transition hover:bg-white">
              Découvrir
              <span className="text-slate-400">→</span>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

