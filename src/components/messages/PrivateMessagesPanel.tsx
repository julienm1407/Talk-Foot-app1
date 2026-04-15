import { useEffect, useRef, useState } from 'react'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useDirectMessagesContext } from '../../contexts/DirectMessagesContext'
import { cn } from '../../utils/cn'
import {
  mockDirectThreads,
  type DirectMessageLine,
  type DirectThread,
} from '../../data/directMessagesMock'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { Avatar } from '../ui/Avatar'

export function PrivateMessagesPanel({ onClose }: { onClose: () => void }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [active, setActive] = useState<DirectThread | null>(null)
  const { mergedFor, send, visitedIds, markVisited, setActiveDmUiThreadId } = useDirectMessagesContext()

  useEffect(() => {
    setActiveDmUiThreadId(active?.id ?? null)
    return () => setActiveDmUiThreadId(null)
  }, [active, setActiveDmUiThreadId])

  useEffect(() => {
    if (active) markVisited(active.id)
  }, [active, markVisited])

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
        shell,
      )}
      role="dialog"
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
          <span className="block text-sm font-black max-md:text-base">
            {active ? (
              <>
                {active.peer.username}
                {active.peer.isTalkFootBot ? (
                  <span className={cn('ml-2 text-xs font-bold', L ? 'text-violet-700' : 'text-violet-300')}>
                    · Assistant
                  </span>
                ) : null}
              </>
            ) : (
              'Messages privés'
            )}
          </span>
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
            {mockDirectThreads.map((t) => {
              const lines = mergedFor(t.id)
              const last = lines[lines.length - 1]
              const preview = last?.body ?? t.lastPreview
              const atLabel = last?.atLabel ?? t.lastAtLabel
              const showUnread = t.unread && !visitedIds.includes(t.id)
              return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActive(t)}
                  className={cn(
                    'flex w-full gap-2 px-3 py-3 text-left transition max-md:min-h-[3.25rem] md:py-2.5',
                    rowHover,
                  )}
                >
                  <Avatar seed={t.peer.avatarSeed} accent={t.peer.accent} className="!size-10 shrink-0" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-xs font-black">
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
                      <span className={cn('shrink-0 text-[10px] font-bold', muted)}>{atLabel}</span>
                    </div>
                    <p className={cn('mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug', muted)}>
                      {preview}
                    </p>
                  </div>
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
  onSend: (body: string) => void
  subtleBorder: string
  L: boolean
}) {
  const [draft, setDraft] = useState('')
  const lines = messages
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lines.length])

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    onSend(t)
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
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
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
