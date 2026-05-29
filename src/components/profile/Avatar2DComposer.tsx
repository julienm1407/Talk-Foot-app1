import { useMemo } from 'react'
import type { UserProfile } from '../../types/profile'
import { mergeCharacterLook } from '../../data/characterPresets'
import { avatarItems } from '../../data/shop'
import { resolveAvatarLoadout } from '../../data/avatar2dCatalog'
import { Avatar2DKitPreview } from './Avatar2DKitPreview'

type Props = {
  profile: UserProfile
  className?: string
  size?: 'thumb' | 'profile' | 'head'
  crop?: 'full' | 'head'
}

const SIZE_MAP = {
  thumb: { width: 52, height: 74 },
  head: { width: 56, height: 56 },
  profile: { width: 136, height: 196 },
} as const

const ACCESSORY_CLASS = {
  thumb: 'text-[1.05rem]',
  profile: 'text-2xl',
} as const

export function Avatar2DComposer({ profile, className, size = 'profile', crop = 'full' }: Props) {
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
  const pants = avatarItems.find((item) => item.id === pantsId)
  const box = SIZE_MAP[size]

  return (
    <div className={className} style={{ width: box.width, height: box.height }}>
      <Avatar2DKitPreview
        kitItem={kit}
        pantsItem={pants}
        look={look}
        size={size === 'head' ? 'head' : size === 'thumb' ? 'thumb' : 'profile'}
        crop={crop}
        accessoryEmoji={
          accessory && accessory.id !== 'accessory-default' ? accessory.emoji : null
        }
        accessoryClass={ACCESSORY_CLASS[size === 'head' ? 'thumb' : size]}
      />
    </div>
  )
}

export function Avatar2DThumb({ profile, className }: { profile: UserProfile; className?: string }) {
  return <Avatar2DComposer profile={profile} className={className} size="thumb" />
}

/** Vignette profil : uniquement la tête (nav, classements, commentaires…). */
export function Avatar2DHeadThumb({ profile, className }: { profile: UserProfile; className?: string }) {
  return <Avatar2DComposer profile={profile} className={className} size="head" crop="head" />
}

export function Avatar2DProfile({ profile, className }: { profile: UserProfile; className?: string }) {
  return <Avatar2DComposer profile={profile} className={className} size="profile" />
}
