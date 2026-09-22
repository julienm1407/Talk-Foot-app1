import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

const HIDDEN_PATHS = ['/login', '/register', '/signup', '/enfant', '/child-safety']

/** Bandeau visible dès qu’on est connecté, tant que les alertes match ne sont pas allumées. */
export function KickoffAlertsBanner() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { kickoffAlertsEnabled, setKickoffAlertsEnabled } = useFanPreferences()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  if (!user || kickoffAlertsEnabled) return null
  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null

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
        <p className="text-sm font-black">
          Notifications match — 15 min avant le coup d’envoi de tes clubs favoris.
        </p>
        <button
          type="button"
          className={cn(
            TF_FOCUS_VISIBLE,
            'shrink-0 rounded-xl border-2 px-4 py-2.5 text-sm font-black shadow-sm',
            L
              ? 'border-sky-700 bg-sky-600 text-white hover:bg-sky-500'
              : 'border-sky-300 bg-sky-500 text-white hover:bg-sky-400',
          )}
          onClick={() => setKickoffAlertsEnabled(true)}
        >
          Activer les notifications
        </button>
      </div>
    </div>
  )
}
