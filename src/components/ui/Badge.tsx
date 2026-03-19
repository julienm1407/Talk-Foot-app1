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
      ? 'border-tf-grey-pastel/60 bg-tf-white/90 text-rose-600'
      : tone === 'upcoming'
        ? 'border-tf-grey-pastel/60 bg-tf-white/85 text-tf-grey'
        : 'border-tf-grey-pastel/60 bg-tf-white/85 text-tf-grey'

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

