import { useLocation } from 'react-router-dom'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { Button } from '../ui/Button'

/** Accueil uniquement : rappel si tu as quitté avant de finir (pas sur toutes les pages) */
export function FanSetupBanner() {
  const { pathname } = useLocation()
  const { preferencesComplete, onboardingOpen, openOnboarding } = useFanPreferences()
  if (pathname !== '/' || preferencesComplete || onboardingOpen) return null

  return (
    <div className="mx-auto w-full max-w-[1240px] px-3 pt-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 shadow-sm">
        <p className="text-sm font-bold text-amber-950">
          Club + ligue : actus et salons sur mesure.
        </p>
        <Button variant="primary" className="shrink-0 rounded-xl text-sm" onClick={openOnboarding}>
          Configurer
        </Button>
      </div>
    </div>
  )
}
