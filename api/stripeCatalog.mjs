/** Catalogue Stripe (miroir de `src/config/stripeCatalog.ts`) pour les fonctions Vercel. */

export const STRIPE_PRICE = {
  subscription: {
    supporter_plus: 'price_1TebiTRZHpojSftNXPLKhRTB',
    ambassador: 'price_1TebkfRZHpojSftNt4I6Gwc4',
  },
  medalPack: {
    'medal-pack-199': 'price_1TebquRZHpojSftNTdL5qx8D',
    'medal-pack-499': 'price_1TebrLRZHpojSftNSARtG7E4',
    'medal-pack-999': 'price_1TebrvRZHpojSftNsfnCcoq8',
    'medal-pack-1999': 'price_1TebsoRZHpojSftNwvNudZNR',
    'medal-pack-4999': 'price_1TebtgRZHpojSftNZ8m48egh',
    'medal-pack-9999': 'price_1TebuTRZHpojSftNJrctto4J',
  },
}

/** Médailles créditées après paiement (aligné sur `src/data/shop.ts`). */
export const MEDAL_PACK_GRANTS = {
  'medal-pack-199': 20,
  'medal-pack-499': 60,
  'medal-pack-999': 130,
  'medal-pack-1999': 280,
  'medal-pack-4999': 750,
  'medal-pack-9999': 1700,
}

export const SUBSCRIPTION_TIER_BY_KEY = {
  supporter_plus: 'supporter_plus',
  ambassador: 'ambassador',
}
