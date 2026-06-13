import { Link } from 'react-router-dom'
import type { MatchTribuneZone, User } from '../../types/chat'
import { useProfile } from '../../hooks/useProfile'
import { resolveChatMessagePeerUi } from '../../utils/chatPeerSocial'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { ChatCharacterThumb } from './ChatCharacterThumb'
import { VerifiedBadge } from '../subscription/VerifiedBadge'

export type LiveMatchChatMessageItem = {
  id: string
  userId: string
  username: string
  text: string
  time: string
  avatarSeed: string
  avatarAccent?: 'violet' | 'emerald' | 'rose' | 'amber'
  likes?: number
  likedByMe?: boolean
  matchTribune?: MatchTribuneZone
  emoteId?: string
  /** Tri chronologique tribune (ms UTC). */
  createdAtMs?: number
}

export function LiveMatchChatMessage({
  message,
  user,
  selfUserId = 'me',
  selfChatActorId = null,
  selfClerkUserId = null,
  socialEnabled = false,
  likeState,
  onToggleLike,
  onOpenPeerMenu,
  showVerifiedBadge = false,
  light = false,
}: {
  message: LiveMatchChatMessageItem
  user?: User
  selfUserId?: string
  selfChatActorId?: string | null
  selfClerkUserId?: string | null
  socialEnabled?: boolean
  likeState?: { likes: number; likedByMe: boolean }
  onToggleLike: (id: string) => void
  onOpenPeerMenu?: () => void
  showVerifiedBadge?: boolean
  light?: boolean
}) {
  const { profile } = useProfile()
  const likes = likeState?.likes ?? message.likes ?? 0
  const likedByMe = likeState?.likedByMe ?? Boolean(message.likedByMe)

  const peer = resolveChatMessagePeerUi({
    userId: message.userId,
    authorDisplayName: message.username,
    user,
    selfUserId,
    selfChatActorId,
    selfClerkUserId,
    cloudDisplayName: user?.username,
    socialEnabled,
  })

  const chatUser: User | undefined =
    user ??
    ({
      id: message.userId,
      username: message.username,
      avatarSeed: message.avatarSeed,
      accent: message.avatarAccent ?? 'violet',
    } satisfies User)

  return (
    <article
      className={cn(
        'tf-chat-message flex items-start gap-2 rounded-lg p-1.5 transition',
        light ? 'bg-white/95 hover:bg-white' : 'bg-[#0a2239] hover:bg-[#0f2841]',
      )}
    >
      <ChatCharacterThumb
        to={peer.profileTo}
        onPeerMenu={peer.peerSocial ? onOpenPeerMenu : undefined}
        user={chatUser}
        selfProfile={profile}
        isSelf={peer.isSelfMessage}
        size="compact"
        className={TF_FOCUS_VISIBLE}
        aria-label={
          peer.peerSocial
            ? `Contacter ${peer.displayName}`
            : peer.isSelfMessage
              ? 'Moi — profil'
              : `Profil ${peer.displayName}`
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {peer.peerSocial ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenPeerMenu?.()
                }}
                className={cn(
                  'truncate text-xs font-semibold underline-offset-2 hover:underline',
                  light ? 'text-tf-app-fg' : 'text-tf-app-fg',
                  TF_FOCUS_VISIBLE,
                  'rounded-sm',
                )}
              >
                {peer.displayName}
              </button>
            ) : peer.profileTo ? (
              <Link
                to={peer.profileTo}
                className={cn(
                  'truncate text-xs font-semibold underline-offset-2 hover:underline',
                  light ? 'text-tf-app-fg' : 'text-tf-app-fg',
                  TF_FOCUS_VISIBLE,
                  'rounded-sm',
                )}
              >
                {peer.displayName}
              </Link>
            ) : (
              <p className="truncate text-xs font-semibold text-tf-app-fg">{peer.displayName}</p>
            )}
            {showVerifiedBadge ? <VerifiedBadge size="xs" /> : null}
            {message.matchTribune ? (
              <span
                className={cn(
                  'shrink-0 rounded border px-1 py-px text-[8px] font-bold uppercase tracking-wide',
                  light
                    ? 'border-tf-dark/12 bg-tf-grey-pastel/30 text-tf-app-muted'
                    : 'border-[color:var(--tf-c30-border)] bg-black/25 text-tf-app-muted',
                )}
              >
                {message.matchTribune === 'home-ultras'
                  ? 'Ultras'
                  : message.matchTribune === 'away-ultras'
                    ? 'Parcage'
                    : message.matchTribune === 'analystes'
                      ? 'Analyse'
                      : 'Neutre'}
              </span>
            ) : null}
          </div>
          <p className={cn('shrink-0 text-[10px]', light ? 'text-tf-app-muted' : 'text-tf-app-muted')}>
            {message.time}
          </p>
        </div>
        <p className={cn('mt-0.5 text-xs leading-tight', light ? 'text-tf-app-fg' : 'text-tf-app-fg')}>
          {message.text}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onToggleLike(message.id)}
        className={cn(
          'tf-chat-like mt-0.5 inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-bold transition',
          likedByMe
            ? 'border-rose-300/70 bg-rose-400/20 text-rose-100'
            : likes > 0
              ? 'border-rose-400/45 bg-rose-500/10 text-rose-100'
              : light
                ? 'border-slate-200 bg-white text-tf-app-muted hover:border-rose-200'
                : 'border-[#3a6690] bg-[#08223a] text-tf-app-fg hover:border-sky-300/70',
        )}
        title={likedByMe ? 'Retirer ton like' : 'Aimer ce message'}
        aria-pressed={likedByMe}
      >
        <span aria-hidden="true">{likedByMe ? '❤️' : likes > 0 ? '❤️' : '🤍'}</span>
        <span aria-live="polite">{likes}</span>
      </button>
    </article>
  )
}
