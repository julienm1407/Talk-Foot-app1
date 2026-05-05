import type { UserProfile } from '../../types/profile'
import { Avatar2DProfile } from './Avatar2DComposer'

export function DressableCharacter({
  profile,
  className,
}: {
  profile: UserProfile
  variant: 'front' | 'back'
  className?: string
  supporterFanClubId?: string | null
}) {
  return <Avatar2DProfile profile={profile} className={className} />
}
