import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useDirectMessagesContext } from '../../contexts/DirectMessagesContext'
import { usePrivateMessagesUi } from '../../contexts/PrivateMessagesUiContext'
import { cn } from '../../utils/cn'
import { type DirectMessageLine, type DirectThread } from '../../data/directMessagesMock'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { Avatar } from '../ui/Avatar'
import { MODERATION_REFUSED_MESSAGE_FR } from '../../utils/bannedWords'

export function PrivateMessagesPanel({
  onClose,
  visible = true,
}: {
  onClose: () => void
  /** Faux quand le panneau est replié mais reste monté (préserve la conversation + synchro ouverture fil). */
  visible?: boolean
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { pendingThreadId, clearPendingThread } = usePrivateMessagesUi()
  const [active, setActive] = useState<DirectThread | null>(null)
  const { mergedFor, send, visitedIds, markVisited, setActiveDmUiThreadId, directThreads } =
    useDirectMessagesContext()

  useEffect(() => {
    setActiveDmUiThreadId(active?.id ?? null)
    return () => setActiveDmUiThreadId(null)
  }, [active, setActiveDmUiThreadId])

  useEffect(() => {
    if (active) markVisited(active.id)
  }, [active, markVisited])

  useEffect(() => {
    if (!pendingThreadId) return
    const t = directThreads.find((x) => x.id === pendingThreadId)
    if (t) setActive(t)
    clearPendingThread()
  }, [pendingThreadId, clearPendingThread, directThreads])

  const shell = L
    ? 'border border-tf-dark/12 bg-white text-tf-dark shadow-xl'
    : 'border border-white/12 bg-[#0c1829] text-white shadow-2xl'

  const muted = L ? 'text-tf-dark/72' : 'text-sky-100/80'
  const subtleBorder = L ? 'border-tf-dark/10' : 'border-white/10'
  const rowHover = L ? 'hover:bg-tf-dark/[0.04]' : 'hover:bg-white/[0.06]'

  return (
    <div
      className={cn(
        'z-[100] flex max-h-[min(70vh,28rem)] w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl',
        'max-md:fixed max-md:left-[max(0.75rem,env(safe-area-inset-left,0px))] max-md:right-[max(0.75rem,env(safe-area-inset-right,0px))] max-md:top-[calc(3.75rem+env(safe-area-inset-top,0px))] max-md:w-auto max-md:max-h-[min(80dvh,calc(100dvh-4.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))]',
        'md:absolute md:right-0 md:top-[calc(100%+10px)] md:max-h-[min(75vh,30rem)]',
        !visible && 'pointer-events-none invisible',
        shell,
      )}
      role="dialog"
      aria-hidden={!visible}
      aria-label="Messages privés"
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5 max-md:py-3',
          subtleBorder,
        )}
      >
        <div className="min-w-0">
          {active ? (
            <button
              type="button"
              onClick={() => setActive(null)}
              className={cn(
                'mb-0.5 text-[11px] font-bold underline-offset-2 hover:underline',
                L ? 'text-sky-700' : 'text-sky-300',
                TF_FOCUS_VISIBLE,
              )}
            >
              ← Conversations
            </button>
          ) : null}
          {active ? (
            <div className="flex min-w-0 items-center gap-2">
              <Link
                to={`/user/${active.peer.id}`}
                className={cn('shrink-0 rounded-full outline-none', TF_FOCUS_VISIBLE)}
                aria-label={`Profil ${active.peer.username}`}
              >
                <Avatar seed={active.peer.avatarSeed} accent={active.peer.accent} className="!size-9" alt="" />
              </Link>
              <Link
                to={`/user/${active.peer.id}`}
                className={cn(
                  'min-w-0 truncate text-sm font-black max-md:text-base outline-none rounded-sm',
                  TF_FOCUS_VISIBLE,
                )}
              >
                {active.peer.username}
                {active.peer.isTalkFootBot ? (
                  <span className={cn('ml-2 text-xs font-bold', L ? 'text-violet-700' : 'text-violet-300')}>
                    · Assistant
                  </span>
                ) : null}
              </Link>
            </div>
          ) : (
            <span className="block text-sm font-black max-md:text-base">Messages privés</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'grid min-h-11 min-w-11 place-items-center rounded-xl border text-lg font-black leading-none',
            L ? 'border-tf-dark/15 text-tf-dark hover:bg-tf-dark/[0.05]' : 'border-white/20 text-white hover:bg-white/[0.08]',
          )}
          aria-label="Fermer les messages privés"
        >
          ×
        </button>
      </div>

      {!active ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <ul className="divide-y" style={{ borderColor: L ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)' }}>
            {directThreads.map((t) => {
              const lines = mergedFor(t.id)
              const last = lines[lines.length - 1]
              const preview = last?.body ?? t.lastPreview
              const atLabel = last?.atLabel ?? t.lastAtLabel
              const showUnread = t.unread && !visitedIds.includes(t.id)
              return (
              <li key={t.id} className="flex w-full items-stretch">
                <Link
                  to={`/user/${t.peer.id}`}
                  className={cn(
                    'flex min-w-0 max-w-[min(72%,14rem)] shrink-0 items-center gap-2 px-3 py-3 md:max-w-[15rem] md:py-2.5',
                    rowHover,
                    TF_FOCUS_VISIBLE,
                  )}
                  aria-label={`Profil ${t.peer.username}`}
                >
                  <Avatar seed={t.peer.avatarSeed} accent={t.peer.accent} className="!size-10 shrink-0" alt="" />
                  <span className="min-w-0 truncate text-xs font-black">
                    {t.peer.username}
                    {t.peer.isTalkFootBot ? (
                      <span
                        className={cn(
                          'ml-1.5 align-middle text-[9px] font-black uppercase tracking-wide',
                          L ? 'text-violet-700' : 'text-violet-300',
                        )}
                      >
                        Assistant
                      </span>
                    ) : null}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActive(t)}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-3 pr-3 text-left transition max-md:min-h-[3.25rem] md:py-2.5',
                    rowHover,
                    TF_FOCUS_VISIBLE,
                  )}
                  aria-label={`Ouvrir la conversation avec ${t.peer.username}`}
                >
                  <div className="flex justify-end">
                    <span className={cn('text-[10px] font-bold', muted)}>{atLabel}</span>
                  </div>
                  <p className={cn('line-clamp-2 text-[11px] font-semibold leading-snug', muted)}>{preview}</p>
                  {showUnread ? (
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            )})}
          </ul>
        </div>
      ) : (
        <ThreadView
          messages={mergedFor(active.id)}
          onSend={(body) => send(active.id, body)}
          subtleBorder={subtleBorder}
          L={L}
        />
      )}
    </div>
  )
}

function ThreadView({
  messages,
  onSend,
  subtleBorder,
  L,
}: {
  messages: DirectMessageLine[]
  onSend: (body: string) => boolean
  subtleBorder: string
  L: boolean
}) {
  const [draft, setDraft] = useState('')
  const [moderationHint, setModerationHint] = useState<string | null>(null)
  const lines = messages
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lines.length])

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    setModerationHint(null)
    const ok = onSend(t)
    if (!ok) {
      setModerationHint(MODERATION_REFUSED_MESSAGE_FR)
      return
    }
    setDraft('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain px-3 py-3 [-webkit-overflow-scrolling:touch]">
        {lines.length === 0 ? (
          <p className={cn('px-1 text-center text-xs font-semibold', L ? 'text-tf-dark/50' : 'text-white/50')}>
            Aucun message encore — envoie le premier.
          </p>
        ) : (
          lines.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[92%] rounded-2xl px-3 py-2 text-sm font-medium',
                m.fromMe
                  ? L
                    ? 'ml-auto bg-sky-600 text-white'
                    : 'ml-auto bg-sky-500/90 text-white'
                  : L
                    ? 'bg-tf-grey-pastel/50 text-tf-dark'
                    : 'bg-white/[0.08] text-sky-50',
              )}
            >
              {m.body}
              <div className={cn('mt-1 text-[9px] font-bold opacity-70')}>{m.atLabel}</div>
            </div>
          ))
        )}
        <div ref={endRef} aria-hidden className="h-px shrink-0" />
      </div>
      <div className={cn('shrink-0 border-t p-3', subtleBorder)}>
        {moderationHint ? (
          <p className="mb-2 text-[11px] font-semibold text-rose-600">{moderationHint}</p>
        ) : null}
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setModerationHint(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Écrire un message…"
            className={cn(
              'min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium outline-none',
              TF_FOCUS_VISIBLE,
              L
                ? 'border-tf-dark/15 bg-tf-grey-pastel/20 text-tf-dark placeholder:text-tf-dark/40'
                : 'border-white/15 bg-white/[0.06] text-white placeholder:text-white/40',
            )}
            aria-label="Zone de message"
          />
          <button
            type="button"
            onClick={submit}
            className={cn(
              'shrink-0 rounded-xl px-3 py-2.5 text-xs font-black',
              TF_FOCUS_VISIBLE,
              L ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-sky-500 text-white hover:bg-sky-400',
            )}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}
