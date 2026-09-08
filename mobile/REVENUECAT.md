# RevenueCat — paiements store (Android / iOS)

Talk Foot utilise **Stripe sur le web** et **RevenueCat** (Google Play / App Store) dans l’app Capacitor.

## Installation (déjà faite)

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync
```

## Variables d’environnement

Dans `.env.local` / Vercel :

```bash
VITE_REVENUECAT_ANDROID_API_KEY=goog_…
VITE_REVENUECAT_IOS_API_KEY=appl_…
```

## Produits à créer (IDs exacts)

| Talk Foot | Product ID store / RevenueCat | Type |
|-----------|-------------------------------|------|
| Ultra | `talkfoot_ultra_monthly` | abonnement |
| Ambassadeur | `talkfoot_ambassador_monthly` | abonnement |
| Pack 20 🏅 | `talkfoot_medals_20` | consommable |
| Pack 60 🏅 | `talkfoot_medals_60` | consommable |
| Pack 130 🏅 | `talkfoot_medals_130` | consommable |
| Pack 280 🏅 | `talkfoot_medals_280` | consommable |
| Pack 750 🏅 | `talkfoot_medals_750` | consommable |
| Pack 1700 🏅 | `talkfoot_medals_1700` | consommable |

Entitlements RC recommandés : `ultra`, `ambassador`.

## Fichiers code

- `src/utils/nativePlatform.ts` — détection web vs natif
- `src/config/revenueCatCatalog.ts` — mapping produits
- `src/lib/payments/revenueCat.ts` — SDK RC
- `src/lib/payments/purchaseRouter.ts` — routeur Stripe / store
- `src/hooks/useTalkFootPurchase.ts` — UI abonnements + médailles
- Boot : `configureRevenueCat()` dans `capacitorBootstrap.ts`

## Suite recommandée

1. Créer les produits Play Console + App Store Connect
2. Les importer dans RevenueCat + offerings
3. Ajouter les clés `VITE_REVENUECAT_*` au build mobile
4. Webhook RevenueCat → backend Talk Foot (sync cloud fiable hors client)
