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
}: {
  profile: UserProfile
  variant: 'front' | 'back'
  className?: string
}) {
  const { favoriteClubId } = useFanPreferences()
  const look = mergeCharacterLook(profile.characterLook)

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
    look.supporterTint && favoriteClubId && teamColors[favoriteClubId]
      ? (teamColors[favoriteClubId] as [string, string])
      : null

  const jerseyOverride = jerseyItem?.jerseyVisual
    ? {
        primary: jerseyItem.jerseyVisual.primary,
        secondary: jerseyItem.jerseyVisual.secondary,
        pattern: jerseyItem.jerseyVisual.pattern,
        stripeLight: jerseyItem.jerseyVisual.stripeLight,
      }
    : null

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className ?? ''}`}
      style={{ width: 100, height: 140 }}
    >
      <CharacterAvatarSvg
        look={look}
        jerseyOverride={jerseyOverride}
        supporterColors={supporterColors}
        variant={variant}
        flocage={variant === 'back' ? flocage : undefined}
        suppressBaseHeadwear={!!hatItem}
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
