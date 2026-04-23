import { avatarItems } from '../../data/shop'
import type { UserProfile } from '../../types/profile'
import { currentUser } from '../../data/users'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { teamColors } from '../../data/teams'
import { mergeCharacterLook } from '../../data/characterPresets'
import { CharacterAvatarSvg } from './CharacterAvatarSvg'

function jerseyNumberFromSeed(seed: string): number {
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return (n % 99) + 1
}

export function DressableCharacter({
  profile,
  variant = 'front',
  className,
  /** Chat / autre user : teinte supporter basée sur ce club ; omis = préférences du viewer. */
  supporterFanClubId,
}: {
  profile: UserProfile
  variant: 'front' | 'back'
  className?: string
  supporterFanClubId?: string | null
}) {
  const { favoriteClubId } = useFanPreferences()
  const look = mergeCharacterLook(profile.characterLook)
  const clubKey =
    supporterFanClubId === undefined ? favoriteClubId : supporterFanClubId || undefined

  const eq = profile.equippedItems ?? {}
  const hatItem = eq.hat ? avatarItems.find((i) => i.id === eq.hat) : null
  const scarfItem = eq.scarf ? avatarItems.find((i) => i.id === eq.scarf) : null
  const jerseyItem = eq.jersey ? avatarItems.find((i) => i.id === eq.jersey) : null
  const accItem = eq.accessory ? avatarItems.find((i) => i.id === eq.accessory) : null

  const flocageNum = jerseyNumberFromSeed(currentUser.avatarSeed)
  const flocageName = currentUser.username.slice(0, 8).toUpperCase()
  const custom = jerseyItem?.id ? profile.jerseyCustomizations?.[jerseyItem.id] : undefined
  const flocage = custom
    ? {
        name: (custom.displayName || flocageName).toUpperCase().slice(0, 10),
        number: String(custom.number || flocageNum).replace(/\D/g, '').slice(0, 2) || String(flocageNum),
      }
    : { name: flocageName, number: String(flocageNum) }

  const supporterColors: [string, string] | null =
    look.supporterTint && clubKey && teamColors[clubKey]
      ? (teamColors[clubKey] as [string, string])
      : null

  const jerseyOverride = jerseyItem?.jerseyVisual
    ? {
        primary: jerseyItem.jerseyVisual.primary,
        secondary: jerseyItem.jerseyVisual.secondary,
        pattern: jerseyItem.jerseyVisual.pattern,
        stripeLight: jerseyItem.jerseyVisual.stripeLight,
      }
    : null

  const pixelJersey = jerseyItem?.jerseyVisual?.pixelPreset
    ? { preset: jerseyItem.jerseyVisual.pixelPreset }
    : null

  const pixelBoost = Boolean(pixelJersey)
  const boxW = pixelBoost ? 132 : 100
  const boxH = pixelBoost ? 185 : 140

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className ?? ''}`}
      style={{ width: boxW, height: boxH }}
    >
      <CharacterAvatarSvg
        look={look}
        jerseyOverride={jerseyOverride}
        supporterColors={supporterColors}
        variant={variant}
        flocage={variant === 'back' ? flocage : undefined}
        suppressBaseHeadwear={!!hatItem}
        pixelJersey={pixelJersey}
        className={pixelBoost ? 'max-h-[185px] max-w-[132px]' : undefined}
      />

      {jerseyItem && !jerseyItem.jerseyVisual && variant === 'front' && (
        <div
          className="pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2 text-2xl drop-shadow-sm"
          aria-hidden
        >
          {jerseyItem.emoji}
        </div>
      )}

      {hatItem && (
        <div
          className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-2xl drop-shadow"
          aria-hidden
        >
          {hatItem.emoji}
        </div>
      )}

      {scarfItem && (
        <div
          className="pointer-events-none absolute left-1/2 top-[38%] z-[5] -translate-x-1/2 text-xl drop-shadow"
          aria-hidden
        >
          {scarfItem.emoji}
        </div>
      )}

      {accItem && (
        <div
          className="pointer-events-none absolute right-0 top-[55%] z-10 -translate-y-1/2 text-xl drop-shadow"
          aria-hidden
        >
          {accItem.emoji}
        </div>
      )}
    </div>
  )
}
