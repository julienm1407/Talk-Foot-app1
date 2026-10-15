/** Bloque pinch / double-doigt / molette+Ctrl qui zooment la page (boutique, WebView). */
export function attachPinchZoomLock(target: EventTarget): () => void {
  const blockMultiTouch = (e: TouchEvent) => {
    if (e.touches.length > 1) e.preventDefault()
  }
  const blockGesture = (e: Event) => {
    e.preventDefault()
  }
  const blockCtrlWheel = (e: WheelEvent) => {
    if (e.ctrlKey) e.preventDefault()
  }
  target.addEventListener('touchmove', blockMultiTouch as EventListener, { passive: false })
  target.addEventListener('gesturestart', blockGesture)
  target.addEventListener('gesturechange', blockGesture)
  target.addEventListener('wheel', blockCtrlWheel as EventListener, { passive: false })
  return () => {
    target.removeEventListener('touchmove', blockMultiTouch as EventListener)
    target.removeEventListener('gesturestart', blockGesture)
    target.removeEventListener('gesturechange', blockGesture)
    target.removeEventListener('wheel', blockCtrlWheel as EventListener)
  }
}
