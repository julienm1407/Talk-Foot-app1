import { cn } from '../../utils/cn'

export function Badge({
  children,
  tone = 'neutral',
  className,
  ...props
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'live' | 'upcoming' | 'navy'
  className?: string
} & React.HTMLAttributes<HTMLSpanElement>) {
  const toneClass =
    tone === 'live'
      ? 'border-rose-400/55 bg-gradient-to-b from-rose-50 to-white text-rose-800 shadow-sm'
      : tone === 'upcoming'
        ? 'border-tf-electric/35 bg-tf-electric-soft text-tf-electric-deep'
        : tone === 'navy'
          ? 'border-tf-dark/22 bg-white/90 text-tf-dark shadow-sm'
          : 'border-tf-grey-pastel/60 bg-tf-ice/90 text-tf-grey'

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

