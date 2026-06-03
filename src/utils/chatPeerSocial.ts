import type { ChatPeerQuickMenuTarget } from '../components/chat/ChatPeerQuickMenu'
import type { User } from '../types/chat'
import { resolveChatDisplayLabel } from './chatDisplayName'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isChatActorUuid(userId: string): boolean {
  return UUID_RE.test(userId)
}

/** Joueur réel (cloud) : menu MP / ami au clic sur la PP. */
export function canOpenChatPeerSocialMenu(
  userId: string,
  user: User | undefined,
  selfActorId: string | null,
): boolean {
  if (!isChatActorUuid(userId)) return false
  if (selfActorId && userId === selfActorId) return false
  if (user?.isGroupSalonBot || user?.isTalkFootBot) return false
  return true
}

export function isSelfChatMessage(
  userId: string,
  selfUserId: string,
  selfChatActorId: string | null,
  selfClerkUserId?: string | null,
): boolean {
  if (userId === selfUserId) return true
  if (selfChatActorId != null && userId === selfChatActorId) return true
  if (selfClerkUserId && userId === selfClerkUserId) return true
  return false
}

export function buildChatPeerMenuTarget(
  userId: string,
  displayName: string,
  user?: User,
): ChatPeerQuickMenuTarget {
  return {
    id: userId,
    username: displayName,
    avatarSeed: user?.avatarSeed,
    accent: user?.accent,
  }
}

export function resolveChatMessagePeerUi(options: {
  userId: string
  authorDisplayName?: string
  user?: User
  selfUserId: string
  selfChatActorId: string | null
  selfClerkUserId?: string | null
  cloudDisplayName?: string | null
  socialEnabled: boolean
  isBot?: boolean
}): {
  isSelfMessage: boolean
  peerSocial: boolean
  profileTo: string | undefined
  menuTarget: ChatPeerQuickMenuTarget
  displayName: string
} {
  const displayName = resolveChatDisplayLabel(
    options.authorDisplayName,
    options.cloudDisplayName ?? options.user?.username,
  )
  const isSelfMessage = isSelfChatMessage(
    options.userId,
    options.selfUserId,
    options.selfChatActorId,
    options.selfClerkUserId,
  )
  const peerSocial =
    options.socialEnabled &&
    !options.isBot &&
    canOpenChatPeerSocialMenu(options.userId, options.user, options.selfChatActorId)

  const profileTo = peerSocial
    ? undefined
    : options.isBot
      ? undefined
      : isSelfMessage
        ? '/profile'
        : `/user/${options.userId}`

  return {
    isSelfMessage,
    peerSocial,
    profileTo,
    menuTarget: buildChatPeerMenuTarget(options.userId, displayName, options.user),
    displayName,
  }
}
