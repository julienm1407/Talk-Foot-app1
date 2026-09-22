import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

const HIDDEN_PATHS = ['/login', '/register', '/signup', '/enfant', '/child-safety']
const PROMPT_KEY = 'talkfoot.kickoffAlerts.promptSeen.v1'

function promptAlreadySeen(): boolean {
  try {
    return window.localStorage.getItem(PROMPT_KEY) === '1'
  } catch {
    return false
  }
}

function markPromptSeen() {
  try {
    window.localStorage.setItem(PROMPT_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** Une seule proposition. Ensuite, le réglage reste uniquement dans le profil. */
export function KickoffAlertsBanner() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { kickoffAlertsEnabled, setKickoffAlertsEnabled } = useFanPreferences()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [seen, setSeen] = useState(promptAlreadySeen)

  useEffect(() => {
    if (kickoffAlertsEnabled) markPromptSeen()
  }, [kickoffAlertsEnabled])

  if (!user || kickoffAlertsEnabled || seen) return null
  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null

  const dismiss = () => {
    markPromptSeen()
    setSeen(true)
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-3 pt-3 sm:px-5">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 shadow-md',
          L
            ? 'border-sky-500/70 bg-sky-50 text-sky-950'
            : 'border-sky-400/50 bg-sky-950/70 text-sky-50',
        )}
      >
        <p className="min-w-0 flex-1 text-sm font-black">
          Activer les notifications match ? 15 min avant le coup d’envoi de tes clubs favoris.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              TF_FOCUS_VISIBLE,
              'rounded-xl px-3 py-2 text-sm font-bold',
              L ? 'text-sky-900/70 hover:bg-sky-100' : 'text-sky-100/80 hover:bg-white/10',
            )}
            onClick={dismiss}
          >
            Plus tard
          </button>
          <button
            type="button"
            className={cn(
              TF_FOCUS_VISIBLE,
              'rounded-xl border-2 px-4 py-2.5 text-sm font-black shadow-sm',
              L
                ? 'border-sky-700 bg-sky-600 text-white hover:bg-sky-500'
                : 'border-sky-300 bg-sky-500 text-white hover:bg-sky-400',
            )}
            onClick={() => {
              setKickoffAlertsEnabled(true)
              dismiss()
            }}
          >
            Activer
          </button>
        </div>
      </div>
    </div>
  )
}
