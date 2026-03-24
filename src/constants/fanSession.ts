/** Après connexion : ouvrir la config supporter (voir `DEMO_FAN_ONBOARDING_EVERY_LOGIN`) */
export const PENDING_FAN_ONBOARDING_KEY = 'talkfoot.pendingFanOnboarding'

/**
 * Démo / maquette : rouvrir l’onboarding fan à **chaque** reconnexion.
 * En production, passer à `false` pour n’afficher la modal qu’aux nouveaux (prefs incomplètes).
 */
export const DEMO_FAN_ONBOARDING_EVERY_LOGIN = true

export function markPendingFanOnboardingAfterLogin() {
  try {
    sessionStorage.setItem(PENDING_FAN_ONBOARDING_KEY, '1')
  } catch {
    /* private mode */
  }
}
