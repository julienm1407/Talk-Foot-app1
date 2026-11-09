import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

const OPEN_PX = 80

function applyKeyboardOffset(px: number) {
  const v = Math.max(0, Math.round(px))
  const root = document.documentElement
  root.style.setProperty('--tf-keyboard-offset', `${v}px`)
  root.classList.toggle('tf-keyboard-open', v >= OPEN_PX)
}

function visualViewportOverlap(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  const layoutH = window.innerHeight
  return Math.max(0, layoutH - vv.height - vv.offsetTop)
}

function syncFromVisualViewport() {
  applyKeyboardOffset(visualViewportOverlap())
}

function scrollActiveFieldIntoView() {
  const el = document.activeElement
  if (!(el instanceof HTMLElement)) return
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return
  window.setTimeout(() => {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  }, 50)
}

/**
 * Sur iOS le clavier recouvre le WebView (position:fixed reste collé en bas).
 * Android redimensionne déjà le WebView : l’overlap visualViewport est ~0.
 */
export async function initKeyboardInset(): Promise<void> {
  applyKeyboardOffset(0)

  const vv = window.visualViewport
  if (vv) {
    vv.addEventListener('resize', syncFromVisualViewport)
    vv.addEventListener('scroll', syncFromVisualViewport)
  }
  window.addEventListener('orientationchange', () => {
    window.setTimeout(syncFromVisualViewport, 250)
  })

  if (!Capacitor.isNativePlatform()) return

  if (Capacitor.getPlatform() === 'ios') {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.None })
    } catch {
      /* plugin absent en preview */
    }
  }

  try {
    await Keyboard.addListener('keyboardWillShow', (info) => {
      applyKeyboardOffset(Math.max(info.keyboardHeight, visualViewportOverlap()))
    })
    await Keyboard.addListener('keyboardDidShow', (info) => {
      applyKeyboardOffset(Math.max(info.keyboardHeight, visualViewportOverlap()))
      scrollActiveFieldIntoView()
    })
    await Keyboard.addListener('keyboardWillHide', () => applyKeyboardOffset(0))
    await Keyboard.addListener('keyboardDidHide', () => applyKeyboardOffset(0))
  } catch {
    /* web */
  }
}
