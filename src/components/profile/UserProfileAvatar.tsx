import { useState } from 'react'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { resolveProfileModularAvatarForDisplay } from '../../utils/chatAuthorModularAvatar'
import { ModularAvatarPortrait } from './ModularAvatarCanvas'
import { DressableCharacter } from './DressableCharacter'
import { SalonBotHeadThumb } from '../channel/SalonBotHeadThumb'

const AVATAR_SHELL =
  'relative mx-auto shrink-0 overflow-hidden rounded-2xl shadow-lg ring-4 ring-white/40 ' +
  'border border-white/10 bg-gradient-to-b from-[#0e1018] to-[#0a0c12] ' +
  'h-[16rem] w-[11rem] sm:mx-0 sm:h-[12.75rem] sm:w-[8.75rem]'

export function UserProfileAvatar({
  peer,
  cloudProfile,
  profileLoading = false,
  displayName,
  className,
}: {
  peer: User
  cloudProfile: UserProfile | null
  /** Chargement cloud en cours — évite d’afficher une tenue factice avant la vraie. */
  profileLoading?: boolean
  displayName?: string
  className?: string
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const profile = cloudProfile ?? buildChatPeerProfile(peer)
  const photoUrl = profile.profilePhotoDataUrl?.trim()
  const hasModular = Boolean(profile.modularAvatar?.data)
  const shellClass = cn(AVATAR_SHELL, className)
  const labelName = displayName?.trim() || peer.username

  if (profileLoading) {
    return (
      <div
        className={cn(shellClass, 'animate-pulse bg-slate-800/50')}
        role="img"
        aria-busy="true"
        aria-label="Chargement de l’avatar"
      />
    )
  }

  if (peer.isTalkFootBot) {
    return (
      <div className={shellClass} role="img" aria-label={`Avatar ${peer.username}`}>
        <SalonBotHeadThumb seed={peer.avatarSeed} kind="coach" className="size-full" />
      </div>
    )
  }

  if (photoUrl && !photoFailed) {
    return (
      <div className={cn(shellClass, 'bg-white/5')} role="img">
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
    const modularState = resolveProfileModularAvatarForDisplay(profile.modularAvatar)
    return (
      <div
        className={shellClass}
        role="img"
        aria-label={`Avatar de ${labelName} — maillot et tenue`}
      >
        <ModularAvatarPortrait state={modularState} imagePriority className="size-full" />
      </div>
    )
  }

  return (
    <div
      className={cn(shellClass, 'overflow-hidden')}
      role="img"
      aria-label={`Avatar de ${labelName} — maillot et tenue`}
    >
      <DressableCharacter
        profile={profile}
        variant="front"
        supporterFanClubId={peer.fanClubId ?? null}
        className="size-full scale-[1.35] origin-bottom"
      />
    </div>
  )
}
