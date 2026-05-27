import { useMemo } from 'react'
import type { UserProfile } from '../../types/profile'
import { CharacterAvatarSvg } from './CharacterAvatarSvg'
import { mergeCharacterLook } from '../../data/characterPresets'
import { avatarItems } from '../../data/shop'
import { resolveAvatarLoadout } from '../../data/avatar2dCatalog'

type Props = {
  profile: UserProfile
  className?: string
  size?: 'thumb' | 'profile'
}

const BASE_W = 100
const BASE_H = 140
const SIZE_MAP = {
  thumb: { width: 52, height: 74, scale: 0.52, accessoryClass: 'text-[1.05rem]' },
  profile: { width: 136, height: 196, scale: 1.36, accessoryClass: 'text-2xl' },
} as const

export function Avatar2DComposer({ profile, className, size = 'profile' }: Props) {
  const loadout = resolveAvatarLoadout(profile)
  const look = useMemo(() => {
    const merged = mergeCharacterLook(profile.characterLook)
    return {
      ...merged,
      skinTone: loadout.skinColor,
      eyeColor: loadout.eyeColor,
      hairColor: loadout.hairColor,
    }
  }, [profile.characterLook, loadout.skinColor, loadout.eyeColor, loadout.hairColor])

  const kit = avatarItems.find((item) => item.id === loadout.kit)
  const accessory = avatarItems.find((item) => item.id === loadout.accessory)
  const pantsId = profile.equippedItems?.pants ?? 'pants-kit'
  const shoesId = profile.equippedItems?.shoes ?? 'shoes-studs'
  const box = SIZE_MAP[size]

  return (
    <div
      className={className}
      style={{ width: box.width, height: box.height }}
    >
      <div style={{ transform: `scale(${box.scale})`, transformOrigin: 'top left' }}>
        <div className="relative inline-flex items-start justify-start" style={{ width: BASE_W, height: BASE_H }}>
          <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.16),transparent_56%)]" />
          <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(ellipse_at_bottom,rgba(15,23,42,0.25),transparent_45%)]" />
          <CharacterAvatarSvg
            look={look}
            jerseyOverride={kit?.jerseyVisual ?? null}
            supporterColors={null}
            variant="front"
            className="drop-shadow-[0_2px_6px_rgba(2,6,23,0.2)]"
            pantsItemId={pantsId}
            shoesItemId={shoesId}
          />
          {accessory && accessory.id !== 'accessory-default' ? (
            <div
              className={`pointer-events-none absolute right-0 top-[55%] z-10 -translate-y-1/2 drop-shadow-[0_2px_6px_rgba(2,6,23,0.55)] ${box.accessoryClass}`}
              aria-hidden
            >
              {accessory.emoji}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function Avatar2DThumb({ profile, className }: { profile: UserProfile; className?: string }) {
  return <Avatar2DComposer profile={profile} className={className} size="thumb" />
}

export function Avatar2DProfile({ profile, className }: { profile: UserProfile; className?: string }) {
  return <Avatar2DComposer profile={profile} className={className} size="profile" />
}
