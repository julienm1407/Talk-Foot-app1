import { useEffect, useRef } from 'react'

/** Scroll auto vers le bas sauf si l’utilisateur a remonté (>80 px du bas). */
export function useAutoScroll<T extends HTMLElement>(deps: unknown[], resetDeps: unknown[] = []) {
  const ref = useRef<T | null>(null)
  const isLocked = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      isLocked.current = distanceFromBottom > 80
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    isLocked.current = false
    const el = ref.current
    if (!el) return
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight
    }
    scrollToBottom()
    requestAnimationFrame(scrollToBottom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps)

  useEffect(() => {
    const el = ref.current
    if (!el || isLocked.current) return
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight
    }
    scrollToBottom()
    requestAnimationFrame(scrollToBottom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

