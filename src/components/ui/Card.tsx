import { cn } from '../../utils/cn'

export function Card({
  className,
  children,
  elevation = 'soft',
  style,
}: {
  className?: string
  children: React.ReactNode
  elevation?: 'none' | 'soft'
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 backdrop-blur',
        elevation === 'soft' && 'shadow-[0_18px_55px_rgba(1,30,51,.08)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

