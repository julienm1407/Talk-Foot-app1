import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { DressableCharacter } from '../profile/DressableCharacter'
import {
  MODULAR_PP_NAV_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import { SalonBotHeadThumb } from './SalonBotHeadThumb'

function peerProfileKey(u: User | undefined): string {
  if (!u) return 'anon'
  return [
    u.id,
    u.avatarSeed,
    u.accent,
    u.fanClubId ?? '',
    JSON.stringify(u.characterLook ?? {}),
    JSON.stringify(u.modularAvatar ?? {}),
  ].join('|')
}

/** Extrait l’emoji affiché dans le pseudo bot tribune (ex. « 🍺 Nom »). */
function emojiFromBotUsername(username: string): string | undefined {
  const m = username.match(/^\p{Extended_Pictographic}/u)
  return m?.[0]
}

/**
 * Miniature auteur du fil : PP modulaire pour les joueurs, tête SVG simple pour les bots.
 */
export function ChatCharacterThumb({
  to,
  onPeerMenu,
  user,
  selfProfile,
  isSelf,
  size = 'salon',
  className,
  'aria-label': ariaLabel,
}: {
  /** Absent pour les bots système (pas de page profil). */
  to?: string
  /** Clic sur la PP d’un autre joueur (menu MP / ami). */
  onPeerMenu?: () => void
  user?: User
  selfProfile: UserProfile
  isSelf: boolean
  /** `compact` : fil live match (tchat canal). */
  size?: 'salon' | 'compact'
  className?: string
  'aria-label'?: string
}) {
  const peerProfile = useMemo(() => buildChatPeerProfile(user), [peerProfileKey(user)])
  const profile = isSelf ? selfProfile : peerProfile
  const isSalonBot = Boolean(user?.isGroupSalonBot)
  const isTalkFootBot = Boolean(user?.isTalkFootBot)
  const isBot = isSalonBot || isTalkFootBot
  const useModularThumb = !isBot && (isSelf || Boolean(user?.modularAvatar))

  const botSeed = useMemo(() => {
    if (isSalonBot && user?.id.startsWith('group-bot:')) {
      return user.id.slice('group-bot:'.length)
    }
    return user?.avatarSeed ?? user?.id ?? 'bot'
  }, [isSalonBot, user?.avatarSeed, user?.id])

  const shellClass = cn(
    'relative isolate block shrink-0 self-start outline-none',
    size === 'compact'
      ? useModularThumb || isBot
        ? 'size-7 min-h-7 min-w-7'
        : 'min-h-7 w-7 overflow-visible pt-px'
      : useModularThumb || isBot
        ? 'size-[2.65rem] min-h-[2.65rem] min-w-[2.65rem] sm:size-[2.85rem] sm:min-h-[2.85rem] sm:min-w-[2.85rem]'
        : 'min-h-[3.5rem] w-[2.65rem] overflow-visible pt-px sm:min-h-[3.65rem] sm:w-[2.85rem]',
    className,
  )

  const figure = isBot ? (
    <SalonBotHeadThumb
      seed={botSeed}
      groupEmoji={isSalonBot ? emojiFromBotUsername(user?.username ?? '') : undefined}
      kind={isTalkFootBot ? 'coach' : 'salon'}
      className="size-full"
      aria-label={ariaLabel}
    />
  ) : useModularThumb ? (
    <ProfileCharacterThumb
      profile={profile}
      size="sm"
      {...MODULAR_PP_NAV_FRAMING}
      className="!h-full !w-full !min-h-0 !min-w-0 rounded-full border-2 border-white/20 shadow-[0_4px_14px_rgba(1,30,51,0.12)]"
      aria-label={ariaLabel}
    />
  ) : (
    <div
      className="pointer-events-none absolute left-1/2 top-0 origin-top"
      style={{ transform: `translateX(-50%) scale(${size === 'compact' ? 0.32 : 0.42})` }}
    >
      <DressableCharacter
        profile={profile}
        variant="front"
        supporterFanClubId={isSelf ? undefined : (user?.fanClubId ?? null)}
      />
    </div>
  )

  if (onPeerMenu) {
    return (
      <button
        type="button"
        onClick={onPeerMenu}
        className={cn(shellClass, TF_FOCUS_VISIBLE, 'cursor-pointer')}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
      >
        {figure}
      </button>
    )
  }

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
