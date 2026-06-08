import { Link } from 'react-router-dom'
import type { Message, User } from '../../types/chat'
import { ChatCharacterThumb } from './ChatCharacterThumb'
import { ChatPeerMenuHost } from '../chat/ChatPeerMenuHost'
import { getEmoteById } from '../../data/emotes'
import { useProfile } from '../../hooks/useProfile'
import { useChatPeerMenu } from '../../hooks/useChatPeerMenu'
import { useDirectMessagesOptional } from '../../contexts/DirectMessagesContext'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'
import { resolveChatDisplayLabel } from '../../utils/chatDisplayName'
import { resolveChatMessagePeerUi } from '../../utils/chatPeerSocial'
import { cn } from '../../utils/cn'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
import { tribuneById } from '../../data/tribunes'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export type MessageListTone = 'light' | 'dark'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function importance(u?: User, userId?: string, selfUserId = 'me') {
  if (!userId) return 'normal' as const
  if (userId === selfUserId) return 'me' as const
  if (!u) return 'normal' as const
  if (u.isGroupSalonBot || u.isTalkFootBot) return 'bot' as const
  if (userId === 'u-1') return 'vip' as const
  if (userId === 'u-2') return 'mod' as const
  return 'normal' as const
}

function nameClass(kind: ReturnType<typeof importance>, accent: string | undefined, dark: boolean) {
  if (dark) {
    if (kind === 'me') return 'text-emerald-200'
    if (kind === 'bot') return 'text-sky-200'
    if (kind === 'vip') return 'text-violet-200'
    if (kind === 'mod') return 'text-blue-200'
    if (accent === 'rose') return 'text-rose-200'
    if (accent === 'amber') return 'text-amber-200'
    return 'text-tf-app-fg'
  }
  if (kind === 'me') return 'text-emerald-700'
  if (kind === 'bot') return 'text-sky-700'
  if (kind === 'vip') return 'text-violet-700'
  if (kind === 'mod') return 'text-blue-700'
  if (accent === 'rose') return 'text-rose-700'
  if (accent === 'amber') return 'text-amber-700'
  return 'text-slate-800'
}

function bubbleClass(kind: ReturnType<typeof importance>, dark: boolean) {
  if (dark) {
    if (kind === 'me') return 'border-emerald-400/50 bg-emerald-950/75 text-tf-app-fg'
    if (kind === 'bot') return 'border-sky-400/45 bg-sky-950/65 text-tf-app-fg'
    if (kind === 'vip') return 'border-violet-400/50 bg-violet-950/60 text-tf-app-fg'
    if (kind === 'mod') return 'border-blue-400/50 bg-blue-950/60 text-tf-app-fg'
    return 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-fg'
  }
  if (kind === 'me') return 'border-emerald-200/80 bg-emerald-50/70 text-slate-700'
  if (kind === 'bot') return 'border-sky-200/80 bg-sky-50/70 text-slate-700'
  if (kind === 'vip') return 'border-violet-200/80 bg-violet-50/70 text-slate-700'
  if (kind === 'mod') return 'border-blue-200/80 bg-blue-50/70 text-slate-700'
  return 'border-slate-200/70 bg-white/70 text-slate-700'
}

export function MessageList({
  messages,
  usersById,
  selfUserId = 'me',
  /** UUID Supabase du compte connecté (tribune cloud). */
  selfChatActorId = null,
  selfClerkUserId = null,
  salonTone = 'light',
  getLikes,
  hasLiked,
  onToggleLike,
}: {
  messages: Message[]
  usersById: Record<string, User>
  /** Identifiant auth (ou `me` en mode démo local) pour bulle « Toi ». */
  selfUserId?: string
  selfChatActorId?: string | null
  /** Identifiant Clerk (si distinct du UUID chat). */
  selfClerkUserId?: string | null
  /** Fond du fil tribune (clair ou sombre). */
  salonTone?: MessageListTone
  getLikes?: (messageId: string) => number
  hasLiked?: (messageId: string) => boolean
  onToggleLike?: (message: Message) => void
}) {
  const { profile } = useProfile()
  const dm = useDirectMessagesOptional()
  const { peerMenu, openPeerMenu, closePeerMenu, menuOpen } = useChatPeerMenu()
  const dark = salonTone === 'dark'
  const socialEnabled = isSupabaseConfigured() && Boolean(dm)
  const safeGetLikes = getLikes ?? (() => 0)
  const safeHasLiked = hasLiked ?? (() => false)
  return (
    <ul className="space-y-3" role="list">
      {messages.map((m, i) => {
        const idxFromEnd = messages.length - 1 - i
        const fadeStart = 20
        const fadeSpan = 30
        const t = clamp01((idxFromEnd - fadeStart) / fadeSpan)
        const opacity = 1 - t * 0.9
        const translate = -t * 10

        const u = usersById[m.userId]
        const kind = importance(u, m.userId, selfUserId)
        const time = new Date(m.createdAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const peer = resolveChatMessagePeerUi({
          userId: m.userId,
          authorDisplayName: m.authorDisplayName,
          user: u,
          selfUserId,
          selfChatActorId,
          selfClerkUserId,
          cloudDisplayName: u?.username,
          socialEnabled,
          isBot: kind === 'bot',
        })
        const authorLabel = resolveChatDisplayLabel(m.authorDisplayName, u?.username)
        const openPeerMenuHandler = peer.peerSocial
          ? () => openPeerMenu(peer.menuTarget)
          : undefined

        return (
          <li
            key={m.id}
            className={cn(
              'flex items-start gap-2.5 sm:gap-3',
              idxFromEnd <= 8 && 'tf-chat-in',
            )}
            style={{
              opacity,
              transform: `translate3d(0, ${translate}px, 0)`,
              filter: t > 0.7 ? `blur(${(t - 0.7) * 2}px)` : undefined,
            }}
          >
            <ChatCharacterThumb
              to={peer.profileTo}
              onPeerMenu={openPeerMenuHandler}
              user={u}
              selfProfile={profile}
              isSelf={peer.isSelfMessage}
              className={TF_FOCUS_VISIBLE}
              aria-label={
                peer.peerSocial
                  ? `Contacter ${peer.displayName}`
                  : peer.isSelfMessage
                    ? (u?.username ?? 'Moi — profil')
                    : `Profil ${peer.displayName}`
              }
            />
            <div className="min-w-0 flex-1 pt-px">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                {peer.peerSocial ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openPeerMenuHandler?.()
                    }}
                    className={cn(
                      'max-w-[42%] truncate text-sm font-bold sm:max-w-none',
                      nameClass(kind, u?.accent, dark),
                      TF_FOCUS_VISIBLE,
                      'rounded-sm underline-offset-2 hover:underline',
                    )}
                  >
                    {authorLabel}
                  </button>
                ) : peer.profileTo ? (
                  <Link
                    to={peer.profileTo}
                    className={cn(
                      'max-w-[42%] truncate text-sm font-bold sm:max-w-none',
                      nameClass(kind, u?.accent, dark),
                      TF_FOCUS_VISIBLE,
                      'rounded-sm',
                    )}
                  >
                    {authorLabel}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'max-w-[42%] truncate text-sm font-bold sm:max-w-none',
                      nameClass(kind, u?.accent, dark),
                    )}
                  >
                    {authorLabel}
                  </span>
                )}
                {kind === 'bot' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      dark ? 'bg-sky-500/20 text-sky-200' : 'bg-sky-100 text-sky-700',
                    )}
                  >
                    BOT
                  </span>
                )}
                {kind !== 'bot' && u?.fanClubId && ALL_CLUBS_BY_ID[u.fanClubId] ? (
                  <span
                    className={cn(
                      'inline-flex max-w-[28%] shrink-0 truncate rounded border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide sm:max-w-[120px]',
                      dark
                        ? 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-muted'
                        : 'border-slate-200/90 bg-slate-50 text-slate-600',
                    )}
                  >
                    {ALL_CLUBS_BY_ID[u.fanClubId].shortName}
                  </span>
                ) : null}
                <span
                  className={cn(
                    'shrink-0 text-[11px] font-medium',
                    dark ? 'text-tf-app-muted' : 'text-slate-500',
                  )}
                >
                  {time}
                </span>
                {kind === 'vip' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      dark ? 'bg-violet-500/20 text-violet-200' : 'bg-violet-100 text-violet-700',
                    )}
                  >
                    VIP
                  </span>
                )}
                {kind === 'mod' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      dark ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-700',
                    )}
                  >
                    MOD
                  </span>
                )}
                {kind === 'me' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      dark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    Toi
                  </span>
                )}
                {m.tribune && tribuneById[m.tribune] ? (
                  <span
                    className={cn(
                      'rounded-full border px-1.5 py-0 text-[8px] font-black leading-tight tracking-wide',
                      dark
                        ? 'border-white/15 bg-slate-900/70'
                        : 'border-tf-grey-pastel/60 bg-white/90',
                      tribuneById[m.tribune].text,
                    )}
                    title={`Tribune ${tribuneById[m.tribune].label}`}
                  >
                    <span aria-hidden>{tribuneById[m.tribune].emoji}</span>{' '}
                    {tribuneById[m.tribune].label}
                  </span>
                ) : null}
              </div>
              <div
                className={cn(
                  'relative mt-1 max-w-full break-words rounded-2xl border px-3 py-2 text-sm font-medium leading-relaxed',
                  onToggleLike && 'pr-12',
                  bubbleClass(kind, dark),
                  (m.gifUrl || m.emoteId || m.groupScarf) && 'p-2',
                )}
              >
                {m.groupScarf ? (
                  <div
                    className={cn(
                      'overflow-hidden rounded-xl border shadow-inner',
                      dark ? 'border-white/15 bg-black/25' : 'border-slate-200/80 bg-slate-900/5',
                    )}
                  >
                    <div className="flex h-3 w-full">
                      <span className="h-full flex-1" style={{ background: m.groupScarf.colorA }} />
                      <span className="h-full flex-1" style={{ background: m.groupScarf.colorB }} />
                      <span className="h-full flex-1" style={{ background: m.groupScarf.colorC }} />
                    </div>
                    <div className="px-3 py-2 text-center">
                      <p
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[0.2em]',
                          dark ? 'text-tf-app-muted' : 'text-slate-500',
                        )}
                      >
                        Écharpe · {m.groupScarf.groupName}
                      </p>
                      <p
                        className={cn(
                          'mt-1 font-display text-sm font-black tracking-tight',
                          dark ? 'text-tf-app-fg' : 'text-slate-900',
                        )}
                      >
                        {m.groupScarf.text}
                      </p>
                    </div>
                  </div>
                ) : m.gifUrl ? (
                  <img
                    src={m.gifUrl}
                    alt="GIF"
                    className="max-h-32 max-w-full rounded-xl object-contain"
                  />
                ) : m.emoteId ? (
                  <span className="text-4xl" title={getEmoteById(m.emoteId)?.label}>
                    {getEmoteById(m.emoteId)?.emoji ?? '😀'}
                  </span>
                ) : (
                  m.text
                )}
                {onToggleLike ? (
                  <button
                    type="button"
                    onClick={() => onToggleLike(m)}
                    className={cn(
                      'absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-black leading-none transition',
                      safeHasLiked(m.id)
                        ? dark
                          ? 'border-rose-400/50 bg-rose-950/60 text-rose-200 hover:bg-rose-900/70'
                          : 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'
                        : dark
                          ? 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-muted hover:border-rose-400/40 hover:text-rose-300'
                          : 'border-slate-200 bg-white/85 text-slate-500 hover:border-rose-200 hover:text-rose-500',
                    )}
                    aria-label={safeHasLiked(m.id) ? 'Retirer le like' : 'Liker le commentaire'}
                  >
                    <span aria-hidden>{safeHasLiked(m.id) ? '♥' : '♡'}</span>
                    {safeGetLikes(m.id) > 0 && <span className="tabular-nums">{safeGetLikes(m.id)}</span>}
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
      <ChatPeerMenuHost
        peerMenu={peerMenu}
        menuOpen={menuOpen}
        dark={dark}
        onClose={closePeerMenu}
      />
    </ul>
  )
}
