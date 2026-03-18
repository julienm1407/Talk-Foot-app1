import { cn } from '../../utils/cn'

export function ProgressBar({
  value,
  className,
  tone = 'blue',
}: {
  value: number // 0..100
  className?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'violet' | 'slate'
}) {
  const v = Math.max(0, Math.min(100, value))
  const bar =
    tone === 'emerald'
      ? 'from-emerald-600 to-emerald-400'
      : tone === 'amber'
        ? 'from-amber-600 to-amber-400'
        : tone === 'violet'
          ? 'from-violet-600 to-fuchsia-400'
          : tone === 'slate'
            ? 'from-slate-700 to-slate-500'
            : 'from-blue-700 to-sky-400'

  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', bar)}
        style={{ width: `${v}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

