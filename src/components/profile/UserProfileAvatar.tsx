import { useState } from 'react'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { resolveProfileModularAvatarForDisplay } from '../../utils/chatAuthorModularAvatar'
import { ModularAvatarPortrait } from './ModularAvatarCanvas'
import { DressableCharacter } from './DressableCharacter'
import { SalonBotHeadThumb } from '../channel/SalonBotHeadThumb'

const PORTRAIT_W = 136
const PORTRAIT_H = 196

export function UserProfileAvatar({
  peer,
  cloudProfile,
  profileLoading = false,
  className,
}: {
  peer: User
  cloudProfile: UserProfile | null
  /** Chargement cloud en cours — évite d’afficher une tenue factice avant la vraie. */
  profileLoading?: boolean
  className?: string
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const profile = cloudProfile ?? buildChatPeerProfile(peer)
  const photoUrl = profile.profilePhotoDataUrl?.trim()
  const hasModular = Boolean(profile.modularAvatar?.data)
  const shellClass = cn(
    'relative shrink-0 overflow-hidden rounded-2xl shadow-lg ring-4 ring-white/40',
    'border border-white/10 bg-gradient-to-b from-[#0e1018] to-[#0a0c12]',
    className,
  )
  const portraitStyle = { width: PORTRAIT_W, height: PORTRAIT_H, minWidth: PORTRAIT_W, minHeight: PORTRAIT_H }

  if (profileLoading) {
    return (
      <div
        className={cn(shellClass, 'animate-pulse bg-slate-800/50')}
        style={portraitStyle}
        role="img"
        aria-busy="true"
        aria-label="Chargement de l’avatar"
      />
    )
  }

  if (peer.isTalkFootBot) {
    return (
      <div className={shellClass} style={portraitStyle} role="img" aria-label={`Avatar ${peer.username}`}>
        <SalonBotHeadThumb seed={peer.avatarSeed} kind="coach" className="size-full" />
      </div>
    )
  }

  if (photoUrl && !photoFailed) {
    return (
      <div className={cn(shellClass, 'bg-white/5')} style={portraitStyle} role="img">
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
        style={portraitStyle}
        role="img"
        aria-label={`Avatar de ${peer.username} — maillot et tenue`}
      >
        <ModularAvatarPortrait
          state={modularState}
          width={PORTRAIT_W}
          height={PORTRAIT_H}
          imagePriority
        />
      </div>
    )
  }

  return (
    <div
      className={cn(shellClass, 'overflow-hidden')}
      style={portraitStyle}
      role="img"
      aria-label={`Avatar de ${peer.username} — maillot et tenue`}
    >
      <DressableCharacter
        profile={profile}
        variant="front"
        supporterFanClubId={peer.fanClubId ?? null}
        className="size-full scale-[1.12] origin-bottom"
      />
    </div>
  )
}
