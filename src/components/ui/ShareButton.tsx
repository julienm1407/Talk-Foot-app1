import { useCallback, useEffect, useRef, useState } from 'react'
import { mockDirectThreads } from '../../data/directMessagesMock'
import { useDirectMessagesOptional } from '../../contexts/DirectMessagesContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { absoluteAppUrl, formatInternalShareBody, shareOrCopyLink } from '../../utils/shareContent'
import { Avatar } from './Avatar'

function ShareGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49" />
    </svg>
  )
}

export function ShareButton({
  path,
  title,
  text,
  label = 'Partager',
  compact = false,
  className,
  onDone,
}: {
  /** Chemin app, ex. `/group/xyz` — utilisé seulement pour « Copier le lien ». */
  path: string
  title: string
  text: string
  label?: string
  compact?: boolean
  className?: string
  onDone?: (ok: boolean) => void
}) {
  const dm = useDirectMessagesOptional()
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const rootRef = useRef<HTMLSpanElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const runExternalShare = useCallback(async () => {
    const url = absoluteAppUrl(path)
    const outcome = await shareOrCopyLink({ title, text, url })
    if (outcome === 'shared' || outcome === 'copied') {
      setHint(outcome === 'shared' ? 'Partagé' : 'Lien copié')
      onDone?.(true)
      window.setTimeout(() => setHint(null), 2200)
    } else if (outcome === 'cancelled') {
      onDone?.(false)
    } else {
      setHint('Copie impossible')
      onDone?.(false)
      window.setTimeout(() => setHint(null), 2200)
    }
  }, [path, title, text, onDone])

  const onMainClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!dm) {
        void runExternalShare()
        return
      }
      setOpen((v) => !v)
    },
    [dm, runExternalShare],
  )

  const sendToFriend = useCallback(
    (threadId: string, username: string) => {
      if (!dm) return
      dm.send(threadId, formatInternalShareBody(title))
      setOpen(false)
      setHint(`Envoyé à ${username}`)
      onDone?.(true)
      window.setTimeout(() => setHint(null), 2200)
    },
    [dm, title, onDone],
  )

  return (
    <span ref={rootRef} className={cn('relative z-[5] inline-flex', className)}>
      <button
        type="button"
        onClick={onMainClick}
        aria-expanded={dm ? open : undefined}
        aria-haspopup={dm ? 'dialog' : undefined}
        className={cn(
          TF_FOCUS_VISIBLE,
          compact
            ? 'grid size-9 shrink-0 place-items-center rounded-xl border border-tf-dark/15 bg-white/90 text-tf-dark shadow-sm transition hover:bg-tf-electric-soft sm:size-10'
            : 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border border-tf-dark/12 bg-white/90 px-3 py-2 text-xs font-black text-tf-dark shadow-sm transition hover:border-tf-electric/35 hover:bg-tf-electric-soft',
        )}
        aria-label={compact ? `Partager avec un ami : ${title}` : undefined}
      >
        <ShareGlyph className={compact ? 'size-[1.15rem]' : 'size-4'} />
        {!compact ? <span>{label}</span> : null}
      </button>

      {hint ? (
        <span className="pointer-events-none absolute -bottom-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-tf-dark px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
          {hint}
        </span>
      ) : null}

      {open && dm ? (
        <div
          role="dialog"
          aria-label="Partager avec un ami"
          className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[min(calc(100vw-2rem),17rem)] rounded-2xl border border-tf-dark/12 bg-white p-2 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-wide text-tf-grey">
            Envoyer à un ami
          </p>
          <p className="px-2 pb-2 text-[11px] font-semibold leading-snug text-tf-dark/80">
            <span className="mr-1 inline-block align-middle text-base leading-none" aria-hidden>
              ↗
            </span>
            Repère dans la conversation, sans lien brut.
          </p>
          <ul className="max-h-44 space-y-0.5 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
            {mockDirectThreads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-bold text-tf-dark transition hover:bg-tf-electric-soft',
                    TF_FOCUS_VISIBLE,
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    sendToFriend(t.id, t.peer.username)
                  }}
                >
                  <Avatar seed={t.peer.avatarSeed} accent={t.peer.accent} className="!size-8 shrink-0" alt="" />
                  <span className="min-w-0 truncate">{t.peer.username}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-tf-dark/10 pt-2">
            <button
              type="button"
              className={cn(
                'w-full rounded-xl px-2 py-2 text-left text-[11px] font-semibold text-tf-grey transition hover:bg-tf-grey-pastel/40 hover:text-tf-dark',
                TF_FOCUS_VISIBLE,
              )}
              onClick={(e) => {
                e.stopPropagation()
                void runExternalShare()
                setOpen(false)
              }}
            >
              Copier le lien (hors app)
            </button>
          </div>
        </div>
      ) : null}
    </span>
  )
}
