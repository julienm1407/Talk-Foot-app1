import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'

const SESSION_KEY = 'talkfoot.themeHint.homeDismissed.v1'

/**
 * Rappel unique par session sur l’accueil : lien entre couleurs de l’interface et la bascule Jour / Nuit (TopBar).
 */
export function ThemeArrivalHint({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return
    } catch {
      /* ignore */
    }
    setVisible(true)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold leading-snug sm:gap-3 sm:px-4 sm:text-sm',
        L
          ? 'border-sky-200/80 bg-gradient-to-r from-sky-50/95 to-tf-ice/80 text-tf-dark shadow-sm'
          : 'border-orange-400/25 bg-gradient-to-r from-[#0c1829] to-[#071422] text-white/90 shadow-[0_8px_28px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      <span className="text-base sm:text-lg" aria-hidden>
        {L ? '☀️' : '🌙'}
      </span>
      <p className="min-w-0 flex-1 text-pretty">
        {L ? (
          <>
            Tu es en <strong className="font-black text-sky-800">mode Jour</strong> — fonds clairs et bleus TalkFoot.
            Passe en <strong className="font-black text-tf-dark">Nuit stade</strong> quand tu veux avec{' '}
            <span className="whitespace-nowrap font-black">Jour | Nuit</span> en haut à droite.
          </>
        ) : (
          <>
            Tu es en <strong className="font-black text-orange-200">Nuit stade</strong> — contrastes sombres pour suivre
            le live le soir. Les couleurs des sections (Match, Groupes…) restent en filigrane : même bascule{' '}
            <span className="whitespace-nowrap font-black">Jour | Nuit</span> en haut à droite.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className={cn(
          'shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-black transition sm:text-xs',
          L
            ? 'bg-tf-dark text-white hover:bg-tf-dark-alt'
            : 'bg-white/12 text-white ring-1 ring-white/20 hover:bg-white/18',
        )}
      >
        OK
      </button>
    </div>
  )
}
