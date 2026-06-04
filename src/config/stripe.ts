/** Clé publique Stripe (Checkout / Elements) — jamais la clé secrète `sk_`. */
export function getStripePublishableKey(): string {
  return String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '').trim()
}

export function isStripePublishableConfigured(): boolean {
  return getStripePublishableKey().startsWith('pk_')
}

export function stripeModeLabel(): 'test' | 'live' | null {
  const k = getStripePublishableKey()
  if (k.startsWith('pk_live_')) return 'live'
  if (k.startsWith('pk_test_')) return 'test'
  return null
}
