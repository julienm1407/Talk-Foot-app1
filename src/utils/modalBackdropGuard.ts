import { useEffect, useRef } from 'react'

/** Évite la fermeture immédiate d’une modale par le « ghost click » du même tap/clic. */
export function useModalBackdropGuard(open: boolean, guardMs = 320) {
  const openedAtRef = useRef(0)

  useEffect(() => {
    if (open) openedAtRef.current = performance.now()
  }, [open])

  const shouldIgnoreBackdropClose = () => performance.now() - openedAtRef.current < guardMs

  return { shouldIgnoreBackdropClose }
}
