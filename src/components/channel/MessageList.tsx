import type { Message, User } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

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
  if (kind === 'me') return 'text-emerald-800'
  if (kind === 'vip') return 'text-violet-800'
  if (kind === 'mod') return 'text-blue-800'
  if (accent === 'rose') return 'text-rose-800'
  if (accent === 'amber') return 'text-amber-800'
  return 'text-slate-900'
}

function msgChrome(kind: ReturnType<typeof importance>) {
  if (kind === 'me') return 'border-emerald-200 bg-emerald-50/60'
  if (kind === 'vip') return 'border-violet-200 bg-violet-50/60'
  if (kind === 'mod') return 'border-blue-200 bg-blue-50/60'
  return 'border-slate-200/70 bg-white/50'
}

export function MessageList({
  messages,
  usersById,
}: {
  messages: Message[]
  usersById: Record<string, User>
}) {
  return (
    <div className="space-y-3">
      {messages.map((m, i) => {
        // Newest messages should feel "present"; older ones fade/float away.
        const idxFromEnd = messages.length - 1 - i
        const fadeStart = 18
        const fadeSpan = 26
        const t = clamp01((idxFromEnd - fadeStart) / fadeSpan)
        const opacity = 1 - t * 0.92
        const translate = -t * 14

        const u = usersById[m.userId]
        const kind = importance(u, m.userId)
        const time = new Date(m.createdAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })
        return (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${idxFromEnd <= 6 ? 'tf-chat-in' : ''}`}
            style={{
              opacity,
              transform: `translate3d(0, ${translate}px, 0)`,
              filter: t > 0.72 ? `blur(${(t - 0.72) * 2.2}px)` : undefined,
            }}
          >
            <Avatar
              seed={u?.avatarSeed ?? 'fan'}
              accent={u?.accent ?? 'violet'}
              alt={u?.username ?? 'Utilisateur'}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className={`truncate text-sm font-black ${nameClass(kind, u?.accent)}`}>
                  {u?.username ?? 'Inconnu'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {time}
                </div>
                {kind === 'vip' ? (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-800">
                    VIP
                  </span>
                ) : kind === 'mod' ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                    MOD
                  </span>
                ) : kind === 'me' ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                    TOI
                  </span>
                ) : null}
              </div>
              <div
                className={`mt-1 rounded-2xl border px-3 py-2 whitespace-pre-wrap break-words text-sm font-medium text-slate-700 ${msgChrome(kind)}`}
              >
                {m.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

