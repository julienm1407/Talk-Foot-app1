import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'

const OPEN_PX = 80

function isIosOverlayKeyboard(): boolean {
  if (Capacitor.isNativePlatform()) return Capacitor.getPlatform() === 'ios'
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function applyKeyboardOffset(px: number) {
  const overlay = isIosOverlayKeyboard()
  const v = overlay ? Math.max(0, Math.round(px)) : 0
  const root = document.documentElement
  root.style.setProperty('--tf-keyboard-offset', `${v}px`)
  const open = overlay ? v >= OPEN_PX : px >= OPEN_PX
  root.classList.toggle('tf-keyboard-open', open)
  root.classList.toggle('tf-keyboard-overlay', overlay && open)
}

function visualViewportOverlap(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  const layoutH = window.innerHeight
  return Math.max(0, layoutH - vv.height - vv.offsetTop)
}

function syncFromVisualViewport() {
  if (!isIosOverlayKeyboard()) return
  applyKeyboardOffset(visualViewportOverlap())
}

function pinChatComposeFocus() {
  document.addEventListener(
    'focusin',
    (e) => {
      const t = e.target
      if (!(t instanceof HTMLElement)) return
      if (!t.closest('.tf-chat-compose-mobile-shell')) return
      const x = window.scrollX
      const y = window.scrollY
      requestAnimationFrame(() => window.scrollTo(x, y))
    },
    true,
  )
}

/**
 * iOS : le clavier recouvre le WebView (KeyboardResize.None) → offset.
 * Android / Chrome : le WebView se rétrécit déjà — ne PAS remonter la barre (ça la met au milieu).
 */
export async function initKeyboardInset(): Promise<void> {
  applyKeyboardOffset(0)
  pinChatComposeFocus()

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
      if (!isIosOverlayKeyboard()) {
        applyKeyboardOffset(info.keyboardHeight)
        return
      }
      applyKeyboardOffset(Math.max(info.keyboardHeight, visualViewportOverlap()))
    })
    await Keyboard.addListener('keyboardDidShow', (info) => {
      if (!isIosOverlayKeyboard()) {
        applyKeyboardOffset(info.keyboardHeight)
        return
      }
      applyKeyboardOffset(Math.max(info.keyboardHeight, visualViewportOverlap()))
    })
    await Keyboard.addListener('keyboardWillHide', () => applyKeyboardOffset(0))
    await Keyboard.addListener('keyboardDidHide', () => applyKeyboardOffset(0))
  } catch {
    /* web */
  }
}
