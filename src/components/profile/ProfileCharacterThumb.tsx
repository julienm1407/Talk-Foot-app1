import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { resolveModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import { ModularAvatarHeadThumb } from './ModularAvatarCanvas'

const PRESETS = {
  sm: 40,
  md: 56,
  chat: 72,
  lg: 96,
} as const

export function ProfileCharacterThumb({
  profile,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  profile: UserProfile
  size?: keyof typeof PRESETS
  peerFanClubId?: string | null
  className?: string
  'aria-label'?: string
}) {
  const thumbPx = PRESETS[size]
  const modularState = resolveModularAvatarState(profile.modularAvatar)

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border-2 border-tf-grey-pastel/50 bg-gradient-to-b from-[#0e1018] to-[#0a0c12]',
        className,
      )}
      style={{ width: thumbPx, height: thumbPx, minWidth: thumbPx, minHeight: thumbPx }}
      role="img"
      aria-label={ariaLabel ?? 'Photo de profil — tête de mon avatar modulaire'}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <ModularAvatarHeadThumb state={modularState} size={thumbPx} />
      </div>
    </div>
  )
}
