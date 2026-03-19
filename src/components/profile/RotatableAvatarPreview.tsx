import { useState, useRef, useCallback } from 'react'
import { DressableCharacter } from './DressableCharacter'
import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'

export function RotatableAvatarPreview({
  profile,
  className,
}: {
  profile: UserProfile
  className?: string
}) {
  const [rotation, setRotation] = useState(0)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startRotation = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startRotation.current = rotation
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [rotation])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - startX.current
      setRotation(startRotation.current + dx)
    },
    [],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-tf-grey">
        Glisse pour tourner •
      </p>
      <div
        className="relative flex h-44 w-36 cursor-grab items-center justify-center rounded-2xl border-2 border-tf-grey-pastel/50 bg-tf-grey-pastel/10 active:cursor-grabbing"
        style={{ perspective: '400px' }}
      >
        <div
          className="relative h-[140px] w-[100px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
          }}
        >
          {/* Face avant */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-tf-white/90 shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
            }}
          >
            <DressableCharacter profile={profile} variant="front" />
          </div>

          {/* Face arrière (dos du maillot avec flocage) */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-tf-white/90 shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <DressableCharacter profile={profile} variant="back" />
          </div>
        </div>
      </div>
    </div>
  )
}
