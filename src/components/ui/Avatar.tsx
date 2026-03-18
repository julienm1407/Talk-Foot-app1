import { cn } from '../../utils/cn'

const accentMap: Record<string, string> = {
  violet: 'from-violet-400/70 to-violet-600/70',
  emerald: 'from-emerald-400/70 to-emerald-600/70',
  rose: 'from-rose-400/70 to-rose-600/70',
  amber: 'from-amber-300/70 to-amber-500/70',
}

export function Avatar({
  seed,
  accent = 'violet',
  className,
  alt = '',
}: {
  seed: string
  accent?: 'violet' | 'emerald' | 'rose' | 'amber'
  className?: string
  alt?: string
}) {
  const gradient = accentMap[accent] ?? accentMap.violet
  const initial = seed.trim().slice(0, 1).toUpperCase() || '⚽'

  return (
    <div
      className={cn(
        'grid size-9 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,.35)]',
        className,
      )}
      aria-label={alt}
    >
      <div
        className={cn(
          'grid size-7 place-items-center rounded-xl bg-gradient-to-br text-xs font-black text-white/90',
          gradient,
        )}
      >
        {initial}
      </div>
    </div>
  )
}

