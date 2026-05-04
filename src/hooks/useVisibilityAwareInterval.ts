import { useEffect, useRef } from 'react'

/**
 * Exécute `tick` toutes les `intervalMs` quand l’onglet est visible ; pause en arrière-plan
 * (moins d’appels SportMonks / relais quand personne ne regarde).
 * Au retour : un `tick` immédiat puis reprise du cycle.
 * @param skipInitialTick — si true, pas de `tick` au montage (évite doublon avec un autre effet).
 */
export function useVisibilityAwareInterval(
  tick: () => void,
  intervalMs: number,
  enabled: boolean,
  skipInitialTick = false,
) {
  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return

    let id: ReturnType<typeof setInterval> | null = null

    const clear = () => {
      if (id != null) {
        window.clearInterval(id)
        id = null
      }
    }

    const arm = () => {
      clear()
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      id = window.setInterval(() => tickRef.current(), intervalMs)
    }

    const onVis = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState === 'hidden') {
        clear()
        return
      }
      tickRef.current()
      arm()
    }

    if (!skipInitialTick) tickRef.current()
    arm()
    document.addEventListener('visibilitychange', onVis)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clear()
    }
  }, [enabled, intervalMs, skipInitialTick])
}
