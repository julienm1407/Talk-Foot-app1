import { useState } from 'react'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { ProfileCharacterThumb } from './ProfileCharacterThumb'
import { SalonBotHeadThumb } from '../channel/SalonBotHeadThumb'

export function UserProfileAvatar({
  peer,
  cloudProfile,
  className,
}: {
  peer: User
  cloudProfile: UserProfile | null
  className?: string
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const profile = cloudProfile ?? buildChatPeerProfile(peer)
  const photoUrl = profile.profilePhotoDataUrl?.trim()
  const hasModular = Boolean(profile.modularAvatar?.data)
  const shellClass = cn(
    'relative shrink-0 overflow-hidden shadow-lg ring-4 ring-white/40',
    peer.isTalkFootBot ? 'rounded-2xl' : 'rounded-2xl',
    className ?? '!size-24',
  )

  if (peer.isTalkFootBot) {
    return (
      <div className={shellClass} role="img" aria-label={`Avatar ${peer.username}`}>
        <SalonBotHeadThumb seed={peer.avatarSeed} kind="coach" className="size-full" />
      </div>
    )
  }

  if (photoUrl && !photoFailed) {
    return (
      <div className={cn(shellClass, 'border border-white/10 bg-white/5')} role="img">
        <img
          src={photoUrl}
          alt=""
          className="size-full object-cover object-top"
          onError={() => setPhotoFailed(true)}
        />
      </div>
    )
  }

  if (hasModular) {
    return (
      <ProfileCharacterThumb
        profile={profile}
        size="lg"
        className={cn(
          shellClass,
          '!rounded-2xl border-white/10 bg-white/5',
          '!h-24 !w-24 !min-h-24 !min-w-24',
        )}
        aria-label={`Avatar de ${peer.username}`}
      />
    )
  }

  return (
    <Avatar
      seed={peer.avatarSeed}
      accent={peer.accent}
      className={shellClass}
      alt={`Avatar de ${peer.username}`}
    />
  )
}
