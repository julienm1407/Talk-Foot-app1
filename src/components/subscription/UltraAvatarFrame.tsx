import ultraAvatarFrame from '../../assets/subscription/ultra-avatar-frame.png'
import { cn } from '../../utils/cn'

/** Anneau doré « ULTRA » par-dessus la PP modulaire (chat / groupe). */
export function UltraAvatarFrame({
  size = 'salon',
  className,
}: {
  size?: 'salon' | 'compact'
  className?: string
}) {
  const inset = size === 'compact' ? '-10%' : '-16%'
  const scale = size === 'compact' ? '120%' : '132%'

  return (
    <img
      src={ultraAvatarFrame}
      alt=""
      aria-hidden
      className={cn('pointer-events-none absolute z-10 max-w-none object-contain', className)}
      style={{
        width: scale,
        height: scale,
        left: inset,
        top: inset,
      }}
    />
  )
}
