import { Card } from './Card'
import { cn } from '../../utils/cn'

export function AdSlot({
  title = 'Publicité',
  brand = 'Talk Foot',
  body = 'Emplacement publicitaire (mock).',
  tone = 'blue',
  imageSeed = 'ad',
  compact,
}: {
  title?: string
  brand?: string
  body?: string
  tone?: 'blue' | 'navy' | 'sky'
  imageSeed?: string
  compact?: boolean
}) {
  const gradient =
    tone === 'navy'
      ? 'from-[#0b1b3a]/12 via-white/70 to-white/80'
      : tone === 'sky'
        ? 'from-sky-400/18 via-white/70 to-white/80'
        : 'from-blue-600/14 via-white/70 to-white/80'

  return (
    <Card elevation="none" className="overflow-hidden">
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

