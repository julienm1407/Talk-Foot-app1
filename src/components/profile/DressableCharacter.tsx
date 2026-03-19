import { HumanAvatar } from '../ui/HumanAvatar'
import { avatarItems } from '../../data/shop'
import type { UserProfile } from '../../types/profile'
import { currentUser } from '../../data/users'

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
  const eq = profile.equippedItems ?? {}
  const hatItem = eq.hat ? avatarItems.find((i) => i.id === eq.hat) : null
  const scarfItem = eq.scarf ? avatarItems.find((i) => i.id === eq.scarf) : null
  const jerseyItem = eq.jersey ? avatarItems.find((i) => i.id === eq.jersey) : null
  const accItem = eq.accessory ? avatarItems.find((i) => i.id === eq.accessory) : null

  const flocageNum = jerseyNumberFromSeed(currentUser.avatarSeed)
  const flocageName = currentUser.username.slice(0, 8).toUpperCase()

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className ?? ''}`}
      style={{ width: 100, height: 140 }}
    >
      {/* Casquette / chapeau */}
      {hatItem && (
        <div className="absolute -top-1 z-10 text-2xl">
          {hatItem.emoji}
        </div>
      )}

      {/* Tête */}
      <div className="relative z-5 mt-1 shrink-0">
        <HumanAvatar
          seed={currentUser.avatarSeed}
          accent={currentUser.accent}
          alt=""
          className="size-14 rounded-full border-2 border-amber-200 shadow-md"
        />
      </div>

      {/* Écharpe (coulant autour du cou) */}
      {scarfItem && (
        <div className="-mt-2 z-5 text-xl">
          {scarfItem.emoji}
        </div>
      )}

      {/* Torse / maillot */}
      <div className="relative -mt-1 flex w-16 flex-col items-center justify-center rounded-b-xl rounded-t-sm border-2 border-slate-300 bg-slate-100 px-2 py-2 shadow-inner">
        {jerseyItem ? (
          variant === 'front' ? (
            <span className="text-2xl">{jerseyItem.emoji}</span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-display text-lg font-black text-slate-800">
                {flocageNum}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
                {flocageName}
              </span>
            </div>
          )
        ) : (
          <span className="text-lg text-slate-400">👕</span>
        )}
      </div>

      {/* Jambes (short / bas) */}
      <div className="-mt-0.5 flex gap-1">
        <div className="h-7 w-4 rounded-b-md bg-slate-500/80" />
        <div className="h-7 w-4 rounded-b-md bg-slate-500/80" />
      </div>

      {/* Accessoire (à la main) */}
      {accItem && (
        <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 text-xl">
          {accItem.emoji}
        </div>
      )}
    </div>
  )
}
