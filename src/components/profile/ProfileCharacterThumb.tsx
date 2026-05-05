import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { Avatar2DThumb } from './Avatar2DComposer'

const PRESETS = {
  sm: 'h-12 w-12 min-h-12 min-w-12',
  md: 'h-16 w-16 min-h-16 min-w-16',
  chat: 'h-[4.75rem] w-[4.75rem] min-h-[4.75rem] min-w-[4.75rem] sm:h-[5.25rem] sm:w-[5.25rem] sm:min-h-[5.25rem] sm:min-w-[5.25rem]',
  lg: 'h-24 w-24 min-h-24 min-w-24 sm:h-28 sm:w-28',
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
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[22px] border-2 border-tf-grey-pastel/50 bg-gradient-to-b from-[#0e1018] to-[#0a0c12]',
        PRESETS[size],
        className,
      )}
      role="img"
      aria-label={ariaLabel ?? 'Mon personnage Talk Foot (avatar)'}
    >
      <div className="absolute left-1/2 top-1 -translate-x-1/2">
        <Avatar2DThumb profile={profile} />
      </div>
    </div>
  )
}
