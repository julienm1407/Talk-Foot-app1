import { useSyncExternalStore } from 'react'

/**
 * Vrai sur téléphones / tablettes tactiles — même si Safari signale une largeur « desktop »
 * (mode « Site bureau » sur iPhone, etc.).
 */
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)'
const NARROW_QUERY = '(max-width: 1279px)'

function subscribe(cb: () => void) {
  const touchMq = window.matchMedia(TOUCH_QUERY)
  const narrowMq = window.matchMedia(NARROW_QUERY)
  touchMq.addEventListener('change', cb)
  narrowMq.addEventListener('change', cb)
  return () => {
    touchMq.removeEventListener('change', cb)
    narrowMq.removeEventListener('change', cb)
  }
}

function getSnapshot() {
  return (
    window.matchMedia(TOUCH_QUERY).matches || window.matchMedia(NARROW_QUERY).matches
  )
}

function getServerSnapshot() {
  return true
}

export function useIsMobileTouchViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
