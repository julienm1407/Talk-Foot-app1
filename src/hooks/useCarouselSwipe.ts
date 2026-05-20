import { useCallback, useRef, type PointerEventHandler } from 'react'

const SWIPE_PX = 44
const SWIPE_MAX_MS = 900

type CarouselSwipeOpts = {
  enabled: boolean
  index: number
  count: number
  onSelect: (index: number) => void
}

/**
 * Glissement horizontal sur un carrousel (touch + souris).
 * Les cibles `a` / `button` ne déclenchent pas le changement de slide.
 */
export function useCarouselSwipe({ enabled, index, count, onSelect }: CarouselSwipeOpts) {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const blockedRef = useRef(false)

  const onPointerDown: PointerEventHandler<HTMLElement> = useCallback(
    (e) => {
      if (!enabled || e.button !== 0) return
      if ((e.target as Element).closest('a, button, input, textarea, select, label')) return
      startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
      blockedRef.current = false
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* navigateurs anciens */
      }
    },
    [enabled],
  )

  const onPointerMove: PointerEventHandler<HTMLElement> = useCallback((e) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx) * 1.05) {
      blockedRef.current = true
    }
  }, [])

  const finish: PointerEventHandler<HTMLElement> = useCallback(
    (e) => {
      if (!enabled || !startRef.current) return
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      const dt = Date.now() - startRef.current.t
      startRef.current = null
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {
        /* noop */
      }
      if (blockedRef.current) return
      if (dt > SWIPE_MAX_MS) return
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.15) return

      e.stopPropagation()
      if (dx < 0) {
        onSelect((index + 1) % count)
      } else {
        onSelect((index - 1 + count) % count)
      }
    },
    [enabled, index, count, onSelect],
  )

  return {
    swipeHandlers: enabled
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp: finish,
          onPointerCancel: finish,
        }
      : {},
  }
}
