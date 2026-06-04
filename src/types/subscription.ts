/** Identifiants des formules Talk Foot (facturation Stripe à brancher plus tard). */
export type SubscriptionTierId = 'freemium' | 'supporter_plus' | 'ambassador'

export type SubscriptionUsageCounters = {
  /** Clé semaine ISO locale (ex. 2026-W23) */
  debatesWeekKey?: string | null
  debatesCreatedThisWeek?: number
  /** Clé jour locale YYYY-MM-DD */
  debatesDayKey?: string | null
  debatesCreatedToday?: number
  messagesDayKey?: string | null
  messagesToday?: number
  /** Timestamp ms du dernier envoi tchat (cooldown freemium). */
  lastChatSendAt?: number | null
  /** Mois YYYY-MM du dernier crédit jetons mensuels */
  monthlyTokensMonthKey?: string | null
}

export type SubscriptionState = {
  tier: SubscriptionTierId
  /** Fin de période payante (ISO), null = pas d’abonnement actif au-delà du tier par défaut */
  activeUntil?: string | null
  usage?: SubscriptionUsageCounters
}

export const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  tier: 'freemium',
  activeUntil: null,
  usage: {},
}
