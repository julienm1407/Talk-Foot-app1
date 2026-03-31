import { cn } from '../../utils/cn'

export function Card({
  className,
  children,
  elevation = 'soft',
  style,
  id,
}: {
  className?: string
  children: React.ReactNode
  elevation?: 'none' | 'soft'
  style?: React.CSSProperties
  id?: string
}) {
  return (
    <div
      id={id}
      style={style}
      className={cn(
        'rounded-tf-3xl border border-tf-grey-pastel/55 bg-white/95 text-tf-dark backdrop-blur-sm',
        elevation === 'soft' && 'shadow-tf-elev-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
