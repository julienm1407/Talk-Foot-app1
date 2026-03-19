import type { Message, User } from '../../types/chat'
import { Avatar } from '../ui/Avatar'
import { getEmoteById } from '../../data/emotes'
import { cn } from '../../utils/cn'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function importance(u?: User, userId?: string) {
  if (!u || !userId) return 'normal' as const
  if (userId === 'me') return 'me' as const
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
  getLikes,
  hasLiked,
  onToggleLike,
}: {
  messages: Message[]
  usersById: Record<string, User>
  getLikes?: (messageId: string) => number
  hasLiked?: (messageId: string) => boolean
  onToggleLike?: (message: Message) => void
}) {
  const safeGetLikes = getLikes ?? (() => 0)
  const safeHasLiked = hasLiked ?? (() => false)
  return (
    <ul className="space-y-4" role="list">
      {messages.map((m, i) => {
        const idxFromEnd = messages.length - 1 - i
        const fadeStart = 20
        const fadeSpan = 30
        const t = clamp01((idxFromEnd - fadeStart) / fadeSpan)
        const opacity = 1 - t * 0.9
        const translate = -t * 10

        const u = usersById[m.userId]
        const kind = importance(u, m.userId)
        const time = new Date(m.createdAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <li
            key={m.id}
            className={cn(
              'flex items-start gap-3',
              idxFromEnd <= 8 && 'tf-chat-in',
            )}
            style={{
              opacity,
              transform: `translate3d(0, ${translate}px, 0)`,
              filter: t > 0.7 ? `blur(${(t - 0.7) * 2}px)` : undefined,
            }}
          >
            <Avatar
              seed={u?.avatarSeed ?? 'fan'}
              accent={u?.accent ?? 'violet'}
              alt={u?.username ?? 'Utilisateur'}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'truncate text-sm font-bold',
                    nameClass(kind, u?.accent),
                  )}
                >
                  {u?.username ?? 'Inconnu'}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {time}
                </span>
                {kind === 'vip' && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                    VIP
                  </span>
                )}
                {kind === 'mod' && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    MOD
                  </span>
                )}
                {kind === 'me' && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Toi
                  </span>
                )}
              </div>
              <div
                className={cn(
                  'mt-1.5 rounded-2xl border px-4 py-2.5 text-sm font-medium leading-relaxed text-slate-700',
                  bubbleClass(kind),
                  (m.gifUrl || m.emoteId) && 'p-2',
                )}
              >
                {m.gifUrl ? (
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
