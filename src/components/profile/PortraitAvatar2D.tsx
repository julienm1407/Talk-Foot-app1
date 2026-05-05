import { useMemo } from 'react'
import type { UserProfile } from '../../types/profile'
import { mergeCharacterLook } from '../../data/characterPresets'
import { resolveAvatarLoadout } from '../../data/avatar2dCatalog'
import { avatarItems } from '../../data/shop'
import { CharacterAvatarSvg } from './CharacterAvatarSvg'

export function PortraitAvatar2D({ profile, className }: { profile: UserProfile; className?: string }) {
  const hasRealPhoto = Boolean(profile.profilePhotoDataUrl)
  const loadout = resolveAvatarLoadout(profile)
  const look = useMemo(() => {
    const merged = mergeCharacterLook(profile.characterLook)
    return {
      ...merged,
      skinTone: loadout.skinColor,
      eyeColor: loadout.eyeColor,
      hairColor: loadout.hairColor,
      faceExpression: merged.faceExpression === 'hyped' ? 'happy' : merged.faceExpression,
    }
  }, [profile.characterLook, loadout.skinColor, loadout.eyeColor, loadout.hairColor])
  const kit = avatarItems.find((item) => item.id === loadout.kit)

  return (
    <div className={className}>
      <div className="relative h-[220px] w-[190px] overflow-hidden rounded-[30px] border border-[#3b5d86] bg-[radial-gradient(120%_120%_at_50%_0%,#173258_0%,#08162b_65%,#050d19_100%)] shadow-[0_20px_50px_rgba(1,10,30,0.75)]">
        <div className="absolute left-1/2 top-[14px] h-[170px] w-[170px] -translate-x-1/2 rounded-full border border-[#7fd14f]/80 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.22),rgba(255,255,255,0)_55%)] shadow-[0_0_0_2px_rgba(157,240,90,0.12),0_0_35px_rgba(151,241,85,0.25)]" />
        <div className="absolute inset-x-0 bottom-0 h-[95px] bg-[linear-gradient(180deg,rgba(1,8,18,0)_0%,rgba(1,8,18,0.42)_38%,rgba(1,8,18,0.9)_100%)]" />
        {hasRealPhoto && profile.profilePhotoDataUrl ? (
          <div className="absolute left-1/2 top-[22px] h-[160px] w-[160px] -translate-x-1/2 overflow-hidden rounded-full border border-white/20 shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
            <img
              src={profile.profilePhotoDataUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="absolute left-1/2 top-[18px] h-[225px] w-[225px] -translate-x-1/2">
            <CharacterAvatarSvg
              look={look}
              jerseyOverride={kit?.jerseyVisual ?? null}
              supporterColors={null}
              variant="front"
              className="h-full w-full max-h-none max-w-none drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]"
            />
          </div>
        )}
      </div>
    </div>
  )
}
