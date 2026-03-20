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
        'rounded-3xl border border-tf-grey-pastel/55 bg-white/95 backdrop-blur-sm',
        elevation === 'soft' && 'shadow-tf-card',
        className,
      )}
    >
      {children}
    </div>
  )
}

