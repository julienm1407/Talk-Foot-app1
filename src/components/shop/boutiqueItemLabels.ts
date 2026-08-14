import type { AvatarItem, AvatarSlot } from '../../types/profile'

const SLOT_LABELS: Record<AvatarSlot, string> = {
  scarf: 'Écharpe',
  hat: 'Casquette',
  jersey: 'Maillot',
  accessory: 'Accessoire',
  pants: 'Short',
  shoes: 'Chaussures',
}

export function boutiqueItemTypeLabel(item: AvatarItem): string {
  if (item.bundleIncludes?.length) {
    if (item.collection === 'cdm2026') return 'Coupe du Monde 2026'
    if (item.collection === 'clubs') return 'Championnats'
    return 'Pack maillot + short'
  }
  return SLOT_LABELS[item.slot]
}
