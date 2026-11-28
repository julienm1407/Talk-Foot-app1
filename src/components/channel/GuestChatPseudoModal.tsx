import { useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { isValidGuestChatPseudo } from '../../utils/guestChatPseudo'

export function GuestChatPseudoModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (pseudo: string) => void
}) {
  const [value, setValue] = useState('')
  if (!open) return null
  const portal = getModalPortalRoot()
  if (!portal) return null
  const ok = isValidGuestChatPseudo(value)

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tf-guest-pseudo-title"
    >
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[22rem] rounded-[24px] border border-white/20 bg-white p-5 text-tf-dark shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Tchat tribune</p>
        <h2 id="tf-guest-pseudo-title" className="mt-1 font-display text-xl font-black leading-tight">
          Choisis un pseudo
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Un écran, puis tu écris. Le compte complet sert aux pronos, à la boutique et à la sauvegarde.
        </p>
        <input
          autoFocus
          value={value}
          maxLength={20}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ex. UltraJulien"
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base text-tf-dark outline-none focus:border-sky-500"
        />
        <button
          type="button"
          disabled={!ok}
          onClick={() => {
            if (!ok) return
            onConfirm(value)
          }}
          className={cn(
            'mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-black text-white',
            ok ? 'bg-tf-cta' : 'bg-slate-300',
          )}
        >
          Entrer dans le tchat
        </button>
      </div>
    </div>,
    portal,
  )
}
