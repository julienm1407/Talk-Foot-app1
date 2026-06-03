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
  if (item.bundleIncludes?.length) return 'Pack maillot + short'
  return SLOT_LABELS[item.slot]
}
