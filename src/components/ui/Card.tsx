import { cn } from '../../utils/cn'

export function Card({
  className,
  children,
  elevation = 'soft',
}: {
  className?: string
  children: React.ReactNode
  elevation?: 'none' | 'soft'
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur',
        elevation === 'soft' && 'shadow-[0_18px_55px_rgba(11,27,58,.10)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

