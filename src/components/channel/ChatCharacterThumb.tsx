import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { cn } from '../../utils/cn'
import { DressableCharacter } from '../profile/DressableCharacter'

function peerProfileKey(u: User | undefined) {
  if (!u) return 'anon'
  return [
    u.id,
    u.avatarSeed,
    u.accent,
    u.fanClubId ?? '',
    JSON.stringify(u.characterLook ?? {}),
  ].join('|')
}

/**
 * Personnage complet en 2D mini (SVG + accessoires), sans cadre — aligné sur le fil pseudo / message.
 */
export function ChatCharacterThumb({
  to,
  user,
  selfProfile,
  isSelf,
  className,
  'aria-label': ariaLabel,
}: {
  /** Absent pour les bots système (pas de page profil). */
  to?: string
  user?: User
  selfProfile: UserProfile
  isSelf: boolean
  className?: string
  'aria-label'?: string
}) {
  const peerProfile = useMemo(() => buildChatPeerProfile(user), [peerProfileKey(user)])
  const profile = isSelf ? selfProfile : peerProfile

  const shellClass = cn(
    'relative isolate block shrink-0 self-start overflow-visible outline-none',
    'min-h-[3.5rem] w-[2.65rem] pt-px sm:min-h-[3.65rem] sm:w-[2.85rem]',
    className,
  )

  const figure = (
    <div
      className="pointer-events-none absolute left-1/2 top-0 origin-top"
      style={{ transform: 'translateX(-50%) scale(0.42)' }}
    >
      <DressableCharacter
        profile={profile}
        variant="front"
        supporterFanClubId={isSelf ? undefined : (user?.fanClubId ?? null)}
      />
    </div>
  )

  if (!to) {
    return (
      <div className={shellClass} aria-label={ariaLabel} role="img">
        {figure}
      </div>
    )
  }

  return (
    <Link to={to} className={shellClass} aria-label={ariaLabel}>
      {figure}
    </Link>
  )
}
