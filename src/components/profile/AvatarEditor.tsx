import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useProfile } from '../../hooks/useProfile'
import { styleCatalog } from '../../data/avatar2dCatalog'
import type { AvatarStyleCategory } from '../../types/profile'

const SLOT_ORDER: AvatarStyleCategory[] = ['kit', 'accessory']
const SLOT_LABELS: Record<AvatarStyleCategory, string> = {
  kit: 'Maillot',
  accessory: 'Accessoire',
}

export function AvatarEditor() {
  const { profile, equipItem, unequipSlot, ownsItem } = useProfile()

  return (
    <Card className="p-5 sm:p-6" elevation="soft">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
            MON PERSONNAGE
          </div>
          <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
            Inventaire premium
          </div>
          <p className="mt-0.5 text-sm font-medium text-tf-grey">
            Équipe un seul item par catégorie premium : maillot et accessoire.
          </p>
        </div>
        <Link to="/boutique">
          <Button variant="primary" className="rounded-2xl">
            Boutique
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <div className="space-y-3">
          {SLOT_ORDER.map((slot) => {
            const equippedId =
              slot === 'kit' ? profile.avatarLoadout.kit : profile.avatarLoadout.accessory
            const equippedItem = styleCatalog.find((i) => i.id === equippedId && i.category === slot) ?? null
            const ownedForSlot = styleCatalog.filter((i) => i.category === slot && ownsItem(i.id))
            return (
              <div
                key={slot}
                className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/90 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase text-tf-grey">
                    {SLOT_LABELS[slot]}
                  </span>
                  {equippedItem && (
                    <button
                      type="button"
                      onClick={() => unequipSlot(slot === 'kit' ? 'jersey' : 'accessory')}
                      className="text-[10px] font-bold text-tf-grey hover:text-rose-600"
                    >
                      Retirer
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {equippedItem ? (
                    <div className="flex items-center gap-2 rounded-xl border-2 border-tf-grey-pastel/60 bg-tf-white px-3 py-2">
                      <span className="text-xl">{equippedItem.image}</span>
                      <span className="text-sm font-bold text-tf-dark">
                        {equippedItem.name}
                      </span>
                    </div>
                  ) : ownedForSlot.length > 0 ? (
                    ownedForSlot.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => equipItem(item.id, slot === 'kit' ? 'jersey' : 'accessory')}
                        className="flex items-center gap-2 rounded-xl border border-tf-grey-pastel/50 bg-tf-white px-3 py-2 text-left transition hover:border-tf-grey-pastel/80 hover:bg-tf-grey-pastel/10"
                      >
                        <span className="text-xl">{item.image}</span>
                        <span className="text-sm font-semibold text-tf-dark">
                          {item.name}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-tf-grey-pastel/60 px-4 py-2 text-xs font-medium text-tf-grey">
                      Aucun — achète dans la boutique
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
