/** Après connexion : ouvrir une fois la config supporter si pas encore faite */
export const PENDING_FAN_ONBOARDING_KEY = 'talkfoot.pendingFanOnboarding'

export function markPendingFanOnboardingAfterLogin() {
  try {
    sessionStorage.setItem(PENDING_FAN_ONBOARDING_KEY, '1')
  } catch {
    /* private mode */
  }
}
