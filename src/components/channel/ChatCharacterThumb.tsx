import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../../types/chat'
import type { UserProfile } from '../../types/profile'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import {
  MODULAR_PP_CHAT_FRAMING,
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

function avatarInitial(username?: string): string {
  const trimmed = username?.trim() ?? ''
  if (!trimmed) return '?'
  const letter = trimmed.replace(/^\p{Extended_Pictographic}+\s*/u, '').trim()[0]
  return (letter ?? trimmed[0] ?? '?').toUpperCase()
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
      : 'size-[2.65rem] min-h-[2.65rem] min-w-[2.65rem] overflow-hidden rounded-full sm:size-[2.85rem] sm:min-h-[2.85rem] sm:min-w-[2.85rem]',
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
      size={size === 'compact' ? 'xs' : 'chat'}
      imagePriority
      {...MODULAR_PP_CHAT_FRAMING}
      className="!h-full !w-full !min-h-0 !min-w-0 rounded-full border-2 border-white/20 shadow-[0_4px_14px_rgba(1,30,51,0.12)]"
      aria-label={ariaLabel}
    />
  ) : (
    <div
      className="flex size-full items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-black text-white shadow-[0_4px_14px_rgba(1,30,51,0.12)]"
      aria-hidden
    >
      {avatarInitial(user?.username)}
    </div>
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
