import { Link } from 'react-router-dom'
import { HumanAvatar } from '../ui/HumanAvatar'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { RotatableAvatarPreview } from './RotatableAvatarPreview'
import { useProfile } from '../../hooks/useProfile'
import { avatarItems } from '../../data/shop'
import type { AvatarSlot } from '../../types/profile'
import { currentUser } from '../../data/users'

const SLOT_ORDER: AvatarSlot[] = ['hat', 'scarf', 'jersey', 'accessory']
const SLOT_LABELS: Record<AvatarSlot, string> = {
  scarf: 'Écharpe',
  hat: 'Casquette',
  jersey: 'Maillot',
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
            Personnalise ton avatar
          </div>
          <p className="mt-0.5 text-sm font-medium text-tf-grey">
            Affiche ton style de supporter dans le chat live
          </p>
        </div>
        <Link to="/boutique">
          <Button variant="primary" className="rounded-2xl">
            Boutique
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Photo de profil + avatar rotatable */}
        <div className="flex shrink-0 flex-col items-center gap-5">
          <div className="flex flex-col items-center">
            <div className="rounded-2xl border-2 border-tf-grey-pastel/50 bg-tf-grey-pastel/10 p-4">
              <HumanAvatar
                seed={currentUser.avatarSeed}
                accent={currentUser.accent}
                alt={currentUser.username}
                className="size-20 rounded-[28px] sm:size-24"
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-tf-grey">
              Ta photo de profil
            </p>
          </div>
          <RotatableAvatarPreview profile={profile} />
        </div>

        {/* Slots d'équipement */}
        <div className="min-w-0 flex-1 space-y-3">
          {SLOT_ORDER.map((slot) => {
            const equippedId = profile.equippedItems[slot]
            const equippedItem = equippedId
              ? avatarItems.find((i) => i.id === equippedId)
              : null
            const ownedForSlot = avatarItems.filter(
              (i) => i.slot === slot && ownsItem(i.id),
            )
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
                      onClick={() => unequipSlot(slot)}
                      className="text-[10px] font-bold text-tf-grey hover:text-rose-600"
                    >
                      Retirer
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {equippedItem ? (
                    <div className="flex items-center gap-2 rounded-xl border-2 border-tf-grey-pastel/60 bg-tf-white px-3 py-2">
                      <span className="text-xl">{equippedItem.emoji}</span>
                      <span className="text-sm font-bold text-tf-dark">
                        {equippedItem.name}
                      </span>
                    </div>
                  ) : ownedForSlot.length > 0 ? (
                    ownedForSlot.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => equipItem(item.id, slot)}
                        className="flex items-center gap-2 rounded-xl border border-tf-grey-pastel/50 bg-tf-white px-3 py-2 text-left transition hover:border-tf-grey-pastel/80 hover:bg-tf-grey-pastel/10"
                      >
                        <span className="text-xl">{item.emoji}</span>
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
