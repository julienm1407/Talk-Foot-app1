import { useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_GUARD_MS = 500
const TOUCH_GUARD_MS = 750

function resolveGuardMs(override?: number): number {
  if (override != null) return override
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return TOUCH_GUARD_MS
  return DEFAULT_GUARD_MS
}

/** Évite la fermeture immédiate d’une modale par le « ghost click » du même tap/clic. */
export function useModalBackdropGuard(open: boolean, guardMs?: number) {
  const guard = resolveGuardMs(guardMs)
  const openedAtRef = useRef(0)
  const [backdropInteractive, setBackdropInteractive] = useState(false)

  useLayoutEffect(() => {
    if (!open) {
      setBackdropInteractive(false)
      return
    }

    openedAtRef.current = performance.now()
    setBackdropInteractive(false)
    const timer = window.setTimeout(() => setBackdropInteractive(true), guard)
    return () => window.clearTimeout(timer)
  }, [open, guard])

  const shouldIgnoreBackdropClose = () =>
    !backdropInteractive || performance.now() - openedAtRef.current < guard

  return {
    shouldIgnoreBackdropClose,
    backdropPointerEvents: backdropInteractive ? ('auto' as const) : ('none' as const),
  }
}
