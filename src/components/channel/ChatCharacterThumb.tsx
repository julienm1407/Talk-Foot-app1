import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { cn } from '../../utils/cn'
import { dicebearAvatarUrl } from '../../utils/dicebearAvatar'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import {
  MODULAR_PP_CHAT_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import { SalonBotHeadThumb } from './SalonBotHeadThumb'
import { UltraAvatarFrame } from '../subscription/UltraAvatarFrame'
import { useSubscription } from '../../hooks/useSubscription'
import { userShowsUltraAvatarFrame } from '../../utils/ultraAvatarFrame'
import { useAuth } from '../../contexts/AuthContext'
import { useTalkFootChatActorId } from '../../hooks/useTalkFootChatActorId'
import { isChatAuthorAvatarPending } from '../../hooks/useChatAuthorModularAvatars'

function peerProfileKey(u: User | undefined): string {
  if (!u) return 'anon'
  return [
    u.id,
    u.avatarSeed,
    u.accent,
    u.fanClubId ?? '',
    u.subscriptionTier ?? '',
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
  const { tier: selfTier } = useSubscription()
  const { user: authUser } = useAuth()
  const chatActorId = useTalkFootChatActorId()
  const selfUserId = chatActorId ?? authUser?.id ?? 'me'
  const [photoFailed, setPhotoFailed] = useState(false)
  const peerProfile = useMemo(() => buildChatPeerProfile(user), [peerProfileKey(user)])
  const profile = isSelf ? selfProfile : peerProfile
  const photoUrl = profile.profilePhotoDataUrl?.trim()
  useEffect(() => {
    setPhotoFailed(false)
  }, [photoUrl])
  const isSalonBot = Boolean(user?.isGroupSalonBot)
  const isTalkFootBot = Boolean(user?.isTalkFootBot)
  const isBot = isSalonBot || isTalkFootBot
  const useModularThumb = !isBot && (isSelf || Boolean(user?.modularAvatar))
  const cloudAvatarPending = Boolean(
    user?.id &&
      !isSelf &&
      !isBot &&
      !user.modularAvatar &&
      isChatAuthorAvatarPending(user.id, selfUserId),
  )
  const dicebearSeed = `${user?.id ?? 'anon'}-${user?.avatarSeed ?? 'fan'}`
  const showUltraFrame = userShowsUltraAvatarFrame(user, { isSelf, selfTier })
  const thumbBorderClass = showUltraFrame
    ? 'border-0 shadow-none'
    : 'border-2 border-white/20 shadow-[0_4px_14px_rgba(1,30,51,0.12)]'

  const botSeed = useMemo(() => {
    if (isSalonBot && user?.id.startsWith('group-bot:')) {
      return user.id.slice('group-bot:'.length)
    }
    return user?.avatarSeed ?? user?.id ?? 'bot'
  }, [isSalonBot, user?.avatarSeed, user?.id])

  const shellClass = cn(
    'relative isolate block shrink-0 self-start overflow-hidden rounded-full outline-none',
    size === 'compact'
      ? 'size-7 min-h-7 min-w-7'
      : 'size-[2.65rem] min-h-[2.65rem] min-w-[2.65rem] sm:size-[2.85rem] sm:min-h-[2.85rem] sm:min-w-[2.85rem]',
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
  ) : photoUrl && !photoFailed ? (
    <img
      src={photoUrl}
      alt=""
      className={cn('size-full rounded-full object-cover object-top', thumbBorderClass)}
      onError={() => setPhotoFailed(true)}
    />
  ) : useModularThumb ? (
    <ProfileCharacterThumb
      profile={profile}
      size={size === 'compact' ? 'xs' : 'sm'}
      imagePriority={isSelf}
      {...MODULAR_PP_CHAT_FRAMING}
      className={cn('!h-full !w-full !min-h-0 !min-w-0 rounded-full', thumbBorderClass)}
      aria-label={ariaLabel}
    />
  ) : cloudAvatarPending ? (
    <div
      className={cn('size-full animate-pulse rounded-full bg-slate-600/70', thumbBorderClass)}
      aria-hidden
    />
  ) : (
    <img
      src={dicebearAvatarUrl(dicebearSeed, 96, 0)}
      alt=""
      className={cn('size-full rounded-full object-cover', thumbBorderClass)}
    />
  )

  const avatarBody = (
    <>
      {figure}
      {showUltraFrame ? <UltraAvatarFrame size={size} /> : null}
    </>
  )

  if (onPeerMenu) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onPeerMenu()
        }}
        className={cn(shellClass, TF_FOCUS_VISIBLE, 'cursor-pointer')}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
      >
        {avatarBody}
      </button>
    )
  }

  if (!to) {
    return (
      <div className={shellClass} aria-label={ariaLabel} role="img">
        {avatarBody}
      </div>
    )
  }

  return (
    <Link to={to} className={shellClass} aria-label={ariaLabel}>
      {avatarBody}
    </Link>
  )
}
