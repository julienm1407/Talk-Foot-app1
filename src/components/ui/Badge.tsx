import { cn } from '../../utils/cn'

export function Badge({
  children,
  tone = 'neutral',
  className,
  ...props
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'live' | 'upcoming'
  className?: string
} & React.HTMLAttributes<HTMLSpanElement>) {
  const toneClass =
    tone === 'live'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : tone === 'upcoming'
        ? 'border-slate-200 bg-white/70 text-slate-700'
        : 'border-slate-200 bg-white/70 text-slate-700'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        toneClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

