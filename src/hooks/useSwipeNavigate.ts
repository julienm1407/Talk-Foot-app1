import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Options = {
  enabled: boolean
  order: string[]
}

function shouldIgnoreTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  if (
    target.closest(
      'input, textarea, select, button, a, label, summary, [contenteditable="true"]',
    )
  )
    return true
  if (target.closest('[data-no-swipe="true"]')) return true
  /** Modales / overlays : ne pas voler le scroll ou les gestes tactiles */
  if (target.closest('[role="dialog"], [data-tf-modal="true"]')) return true
  return false
}

/** Évite de confondre navigation latérale et scroll (molette / trackpad / doigt dans une liste). */
function isInsideScrollableAncestor(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null
  while (el && el !== document.documentElement) {
    const st = window.getComputedStyle(el)
    const box = el as HTMLElement
    const oy = st.overflowY
    const ox = st.overflowX
    if (
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
      box.scrollHeight > box.clientHeight + 2
    ) {
      return true
    }
    if (
      (ox === 'auto' || ox === 'scroll' || ox === 'overlay') &&
      box.scrollWidth > box.clientWidth + 2
    ) {
      return true
    }
    el = el.parentElement
  }
  return false
}

export function useSwipeNavigate({ enabled, order }: Options) {
  const navigate = useNavigate()
  const location = useLocation()
  /** N’écouter les gestes que sur les onglets hub — évite les conflits avec /group/…, articles, etc. */
  const path = location.pathname === '' ? '/' : location.pathname
  const swipeActive = enabled && order.includes(path)

  useEffect(() => {
    if (!swipeActive) return

    let startX = 0
    let startY = 0
    let startT = 0
    let pointerId: number | null = null
    let blocked = false

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (pointerId !== null) return
      /** Souris / stylet : pas de changement de page au drag (évite conflit avec sélection & scroll). */
      if (e.pointerType !== 'touch') return
      if (shouldIgnoreTarget(e.target)) return
      if (isInsideScrollableAncestor(e.target)) return

      pointerId = e.pointerId
      startX = e.clientX
      startY = e.clientY
      startT = Date.now()
      blocked = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dy) > 16 && Math.abs(dy) > Math.abs(dx) * 1.1) {
        blocked = true
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const dt = Date.now() - startT

      pointerId = null
      if (blocked) return

      if (Math.abs(dx) < 90) return
      if (Math.abs(dx) < Math.abs(dy) * 1.3) return
      if (dt > 900) return

      const idx = order.findIndex((p) => p === path)
      if (idx === -1) return

      // Swipe left -> next page, swipe right -> prev page
      const nextIdx = dx < 0 ? idx + 1 : idx - 1
      const next = order[nextIdx]
      if (!next) return
      navigate(next)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [swipeActive, path, navigate, order])
}

