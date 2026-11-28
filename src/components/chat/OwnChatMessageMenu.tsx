import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'
import { MODERATION_REFUSED_MESSAGE_FR, moderateChatText } from '../../utils/bannedWords'
import { correctFrenchText } from '../../utils/frAutoCorrect'

export function OwnChatMessageMenu({
  dark = false,
  canEdit,
  messageText,
  onSave,
  onDelete,
}: {
  dark?: boolean
  canEdit: boolean
  messageText: string
  onSave?: (text: string) => Promise<'ok' | 'moderation' | 'error'>
  onDelete: () => Promise<boolean> | boolean
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'edit' | 'confirm'>('menu')
  const [draft, setDraft] = useState(messageText)
  const [hint, setHint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)

  useEffect(() => {
    if (!open) return
    setMode('menu')
    setDraft(messageText)
    setHint(null)
    setBusy(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, messageText])

  const close = () => setOpen(false)

  const save = async () => {
    if (!onSave) return
    const text = correctFrenchText(draft).trim()
    if (!text) {
      setHint('Écris un message.')
      return
    }
    const check = moderateChatText(text)
    if (!check.ok) {
      setHint(check.message)
      return
    }
    setBusy(true)
    const out = await onSave(text)
    setBusy(false)
    if (out === 'ok') close()
    else if (out === 'moderation') setHint(MODERATION_REFUSED_MESSAGE_FR)
    else setHint('Impossible de modifier. Réessaie.')
  }

  const remove = async () => {
    setBusy(true)
    const ok = await onDelete()
    setBusy(false)
    if (ok) close()
    else setHint('Impossible de supprimer. Réessaie.')
  }

  const portalTarget = getModalPortalRoot()

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className={cn(
          'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-black leading-none',
          dark
            ? 'text-sky-100/80 hover:bg-white/10 hover:text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
          TF_FOCUS_VISIBLE,
        )}
        aria-label="Modifier ou supprimer ton message"
        title="Modifier ou supprimer"
      >
        ⋯
      </button>
      {open && portalTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
              data-tf-modal="true"
              role="presentation"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/55"
                aria-label="Fermer"
                style={{ pointerEvents: backdropPointerEvents }}
                onClick={() => {
                  if (shouldIgnoreBackdropClose()) return
                  close()
                }}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="tf-own-msg-title"
                className={cn(
                  'relative z-[1] w-full max-w-md rounded-t-2xl border p-4 shadow-2xl sm:rounded-2xl',
                  dark
                    ? 'border-[#3a6690]/70 bg-[#0a2239] text-tf-app-fg'
                    : 'border-slate-200 bg-white text-slate-900',
                )}
              >
                <p id="tf-own-msg-title" className="text-sm font-black">
                  {mode === 'edit' ? 'Modifier le message' : mode === 'confirm' ? 'Supprimer ?' : 'Ton message'}
                </p>
                {mode === 'menu' ? (
                  <div className="mt-3 grid gap-2">
                    {canEdit ? (
                      <button
                        type="button"
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left text-sm font-bold',
                          dark
                            ? 'border-[#3a6690] bg-[#08223a] hover:bg-[#0f2841]'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                        )}
                        onClick={() => setMode('edit')}
                      >
                        Modifier
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-left text-sm font-bold text-rose-600',
                        dark
                          ? 'border-rose-400/40 bg-rose-950/40 text-rose-200 hover:bg-rose-950/70'
                          : 'border-rose-200 bg-rose-50 hover:bg-rose-100',
                      )}
                      onClick={() => setMode('confirm')}
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      className="mt-1 text-center text-xs font-bold text-tf-app-muted"
                      onClick={close}
                    >
                      Annuler
                    </button>
                  </div>
                ) : null}
                {mode === 'edit' ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      className={cn(
                        'w-full resize-none rounded-xl border px-3 py-2 text-sm',
                        dark
                          ? 'border-[#3a6690] bg-[#08223a] text-tf-app-fg'
                          : 'border-slate-200 bg-white text-slate-900',
                        TF_FOCUS_VISIBLE,
                      )}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void save()}
                        className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={close}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-sm font-bold',
                          dark ? 'border-[#3a6690]' : 'border-slate-200',
                        )}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : null}
                {mode === 'confirm' ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-semibold text-tf-app-muted">
                      Le message disparaît pour tout le monde. Pas d’annulation.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove()}
                        className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60"
                      >
                        Supprimer
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setMode('menu')}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-sm font-bold',
                          dark ? 'border-[#3a6690]' : 'border-slate-200',
                        )}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : null}
                {hint ? <p className="mt-2 text-xs font-semibold text-rose-400">{hint}</p> : null}
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  )
}
