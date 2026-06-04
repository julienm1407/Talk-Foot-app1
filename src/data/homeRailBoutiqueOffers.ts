import type { HomeRailBoutiqueOffer } from './homeRailBoutiqueOfferTypes'
import {
  boutiqueTabHrefForItem,
  getBoutiqueDailyDeal,
} from './boutiqueDailyDeal'

export type { HomeRailBoutiqueOffer } from './homeRailBoutiqueOfferTypes'

/** Rail « Mon espace » : offre du jour (prix réduit réel dans la boutique). */
export function getHomeRailBoutiqueOffers(): HomeRailBoutiqueOffer[] {
  const deal = getBoutiqueDailyDeal()
  if (!deal) return []

  return [
    {
      id: `daily-${deal.dayKey}-${deal.itemId}`,
      href: `${boutiqueTabHrefForItem(deal.item)}&deal=jour`,
      emoji: deal.item.emoji ?? '⚡',
      title: deal.item.name,
      sub: `${deal.dealCost} 🏅 au lieu de ${deal.originalCost}`,
      badge: `-${deal.discountPercent}%`,
      isDailyDeal: true,
    },
  ]
}
