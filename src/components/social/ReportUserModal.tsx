import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTalkFootChatActorId } from '../../hooks/useTalkFootChatActorId'
import { getSupabaseBrowserClient } from '../../lib/supabase/client'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'
import {
  reportUser,
  USER_REPORT_REASONS,
  type UserReportReasonId,
} from '../../lib/supabase/userReports'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'

export function ReportUserModal({
  open,
  onClose,
  reportedUserId,
  reportedDisplayName,
  dark = false,
}: {
  open: boolean
  onClose: () => void
  reportedUserId: string
  reportedDisplayName?: string
  dark?: boolean
}) {
  const { user } = useAuth()
  const reporterActorId = useTalkFootChatActorId()
  const [reasonId, setReasonId] = useState<UserReportReasonId>('harassment')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)

  useEffect(() => {
    if (!open) return
    setReasonId('harassment')
    setDetails('')
    setBusy(false)
    setHint(null)
    setDone(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const portalTarget = getModalPortalRoot()
  if (!portalTarget) return null

  const shell = dark
    ? 'border-slate-600/50 bg-[#0d2135] text-slate-50 shadow-2xl'
    : 'border-tf-dark/12 bg-white text-tf-dark shadow-xl'
  const muted = dark ? 'text-sky-200/80' : 'text-tf-grey'
  const field = dark
    ? 'border-slate-500/40 bg-[#112a42] text-slate-50'
    : 'border-tf-dark/10 bg-tf-grey-pastel/20 text-tf-dark'

  const submit = async () => {
    setHint(null)
    if (!user?.id || user.isAnonymous) {
      setHint('Connecte-toi pour signaler quelqu’un.')
      return
    }
    if (!reporterActorId) {
      setHint('Session en cours de préparation — réessaie dans une seconde.')
      return
    }
    if (!isSupabaseConfigured()) {
      setHint('Signalement indisponible pour le moment.')
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setHint('Signalement indisponible pour le moment.')
      return
    }
    setBusy(true)
    const out = await reportUser(sb, {
      reporterId: reporterActorId,
      reportedUserId,
      reportedDisplayName,
      reasonId,
      details,
    })
    setBusy(false)
    if (!out.ok) {
      setHint(out.error)
      return
    }
    setDone(true)
    setHint('Merci. Notre équipe examinera ce signalement.')
  }

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[3] grid w-full touch-manipulation place-items-end sm:place-items-center',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-label="Signaler un utilisateur"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        style={{ pointerEvents: backdropPointerEvents }}
        onClick={() => {
          if (shouldIgnoreBackdropClose()) return
          onClose()
        }}
        aria-label="Fermer"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl',
          'max-h-[min(calc(100dvh-1.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)),36rem)]',
          shell,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('border-b px-4 py-3', dark ? 'border-slate-600/40' : 'border-tf-dark/10')}>
          <p className="text-base font-black">Signaler {reportedDisplayName || 'cet utilisateur'}</p>
          <p className={cn('mt-0.5 text-xs font-semibold', muted)}>
            Dis-nous pourquoi — aucun message public n’est envoyé à cette personne.
          </p>
        </div>

        <div className="max-h-[min(28rem,70dvh)] space-y-3 overflow-y-auto overscroll-y-contain p-4">
          {done ? (
            <p className={cn('text-sm font-semibold', muted)}>{hint}</p>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className={cn('text-xs font-black uppercase tracking-wide', muted)}>Motif</legend>
                {USER_REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold',
                      field,
                      reasonId === r.id && (dark ? 'ring-2 ring-sky-400/60' : 'ring-2 ring-sky-500/40'),
                    )}
                  >
                    <input
                      type="radio"
                      name="tf-report-reason"
                      className="accent-sky-500"
                      checked={reasonId === r.id}
                      onChange={() => setReasonId(r.id)}
                    />
                    {r.label}
                  </label>
                ))}
              </fieldset>

              <label className="block">
                <span className={cn('text-xs font-black uppercase tracking-wide', muted)}>
                  Détails (optionnel)
                </span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Contexte utile pour la modération…"
                  className={cn(
                    'mt-1.5 w-full resize-none rounded-xl border px-3 py-2 text-sm font-medium outline-none',
                    TF_FOCUS_VISIBLE,
                    field,
                  )}
                />
              </label>

              {hint ? <p className="text-xs font-semibold text-rose-500">{hint}</p> : null}

              <button
                type="button"
                disabled={busy}
                onClick={() => void submit()}
                className={cn(
                  'w-full rounded-xl px-4 py-3 text-sm font-black text-white transition',
                  TF_FOCUS_VISIBLE,
                  'bg-rose-600 hover:bg-rose-500 disabled:opacity-60',
                )}
              >
                {busy ? 'Envoi…' : 'Envoyer le signalement'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-full rounded-xl py-2.5 text-xs font-black',
              TF_FOCUS_VISIBLE,
              dark ? 'text-sky-200 hover:text-white' : 'text-sky-700 hover:text-sky-800',
            )}
          >
            {done ? 'Fermer' : 'Annuler'}
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
