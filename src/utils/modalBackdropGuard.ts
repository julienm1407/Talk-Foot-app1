import { useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_GUARD_MS = 500

/** Évite la fermeture immédiate d’une modale par le « ghost click » du même tap/clic. */
export function useModalBackdropGuard(open: boolean, guardMs = DEFAULT_GUARD_MS) {
  const openedAtRef = useRef(0)
  const [backdropInteractive, setBackdropInteractive] = useState(false)

  useLayoutEffect(() => {
    if (!open) {
      setBackdropInteractive(false)
      return
    }

    openedAtRef.current = performance.now()
    setBackdropInteractive(false)
    const timer = window.setTimeout(() => setBackdropInteractive(true), guardMs)
    return () => window.clearTimeout(timer)
  }, [open, guardMs])

  const shouldIgnoreBackdropClose = () =>
    !backdropInteractive || performance.now() - openedAtRef.current < guardMs

  return {
    shouldIgnoreBackdropClose,
    backdropPointerEvents: backdropInteractive ? ('auto' as const) : ('none' as const),
  }
}
