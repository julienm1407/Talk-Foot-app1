import { useSyncExternalStore } from 'react'

/** Aligné sur la breakpoint Tailwind `xl` (1280px) — « mobile / tablette » pour le hub accueil. */
const QUERY = '(max-width: 1279px)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot() {
  return true
}

export function useIsBelowXl() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
