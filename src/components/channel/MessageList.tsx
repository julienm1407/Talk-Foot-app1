import { Link } from 'react-router-dom'
import type { Message, User } from '../../types/chat'
import { ChatCharacterThumb } from './ChatCharacterThumb'
import { getEmoteById } from '../../data/emotes'
import { useProfile } from '../../hooks/useProfile'
import { cn } from '../../utils/cn'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
import { tribuneById } from '../../data/tribunes'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function importance(u?: User, userId?: string, selfUserId = 'me') {
  if (!userId) return 'normal' as const
  if (userId === selfUserId) return 'me' as const
  if (!u) return 'normal' as const
  if (userId === 'u-1') return 'vip' as const
  if (userId === 'u-2') return 'mod' as const
  return 'normal' as const
}

function nameClass(kind: ReturnType<typeof importance>, accent?: string) {
  if (kind === 'me') return 'text-emerald-700'
  if (kind === 'vip') return 'text-violet-700'
  if (kind === 'mod') return 'text-blue-700'
  if (accent === 'rose') return 'text-rose-700'
  if (accent === 'amber') return 'text-amber-700'
  return 'text-slate-800'
}

function bubbleClass(kind: ReturnType<typeof importance>) {
  if (kind === 'me') return 'border-emerald-200/80 bg-emerald-50/70'
  if (kind === 'vip') return 'border-violet-200/80 bg-violet-50/70'
  if (kind === 'mod') return 'border-blue-200/80 bg-blue-50/70'
  return 'border-slate-200/70 bg-white/70'
}

export function MessageList({
  messages,
  usersById,
  selfUserId = 'me',
  getLikes,
  hasLiked,
  onToggleLike,
}: {
  messages: Message[]
  usersById: Record<string, User>
  /** Identifiant auth (ou `me` en mode démo local) pour bulle « Toi ». */
  selfUserId?: string
  getLikes?: (messageId: string) => number
  hasLiked?: (messageId: string) => boolean
  onToggleLike?: (message: Message) => void
}) {
  const { profile } = useProfile()
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
        const profileTo = m.userId === selfUserId ? '/profile' : `/user/${m.userId}`

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
              to={profileTo}
              user={u}
              selfProfile={profile}
              isSelf={m.userId === selfUserId}
              className={TF_FOCUS_VISIBLE}
              aria-label={
                m.userId === selfUserId
                  ? (u?.username ?? 'Moi — profil')
                  : `Profil ${u?.username ?? m.authorDisplayName ?? 'Utilisateur'}`
              }
            />
            <div className="min-w-0 flex-1 pt-px">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <Link
                  to={profileTo}
                  className={cn(
                    'max-w-[42%] truncate text-sm font-bold sm:max-w-none',
                    nameClass(kind, u?.accent),
                    TF_FOCUS_VISIBLE,
                    'rounded-sm',
                  )}
                >
                  {u?.username ?? m.authorDisplayName ?? 'Inconnu'}
                </Link>
                {u?.fanClubId && ALL_CLUBS_BY_ID[u.fanClubId] ? (
                  <span className="inline-flex max-w-[28%] shrink-0 truncate rounded border border-slate-200/90 bg-slate-50 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-slate-600 sm:max-w-[120px]">
                    {ALL_CLUBS_BY_ID[u.fanClubId].shortName}
                  </span>
                ) : null}
                <span className="shrink-0 text-[11px] font-medium text-slate-500">
                  {time}
                </span>
                {kind === 'vip' && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">
                    VIP
                  </span>
                )}
                {kind === 'mod' && (
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                    MOD
                  </span>
                )}
                {kind === 'me' && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    Toi
                  </span>
                )}
                {m.tribune && tribuneById[m.tribune] ? (
                  <span
                    className={cn(
                      'rounded-full border border-tf-grey-pastel/60 bg-white/90 px-1.5 py-0 text-[8px] font-black leading-tight tracking-wide',
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
                  'mt-1 rounded-2xl border px-3 py-2 text-sm font-medium leading-relaxed text-slate-700',
                  bubbleClass(kind),
                  (m.gifUrl || m.emoteId || m.groupScarf) && 'p-2',
                )}
              >
                {m.groupScarf ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-900/5 shadow-inner">
                    <div className="flex h-3 w-full">
                      <span className="h-full flex-1" style={{ background: m.groupScarf.colorA }} />
                      <span className="h-full flex-1" style={{ background: m.groupScarf.colorB }} />
                      <span className="h-full flex-1" style={{ background: m.groupScarf.colorC }} />
                    </div>
                    <div className="px-3 py-2 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Écharpe · {m.groupScarf.groupName}
                      </p>
                      <p className="mt-1 font-display text-sm font-black tracking-tight text-slate-900">
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
              </div>
              {onToggleLike && (
                <button
                  type="button"
                  onClick={() => onToggleLike(m)}
                  className={cn(
                    'mt-1 flex items-center gap-1.5 text-xs font-semibold transition',
                    safeHasLiked(m.id)
                      ? 'text-rose-600 hover:text-rose-700'
                      : 'text-slate-400 hover:text-rose-500',
                  )}
                  aria-label={safeHasLiked(m.id) ? 'Retirer le like' : 'Liker le commentaire'}
                >
                  <span aria-hidden>{safeHasLiked(m.id) ? '❤️' : '🤍'}</span>
                  {safeGetLikes(m.id) > 0 && (
                    <span>{safeGetLikes(m.id)}</span>
                  )}
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
