import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import type { ClubPageMock } from '../../data/clubPageMock'

export function ClubInfoDrawer({
  open,
  onClose,
  data,
  clubName,
}: {
  open: boolean
  onClose: () => void
  data: ClubPageMock
  clubName: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (typeof document === 'undefined' || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[160] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="club-info-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-tf-c30-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 id="club-info-title" className="font-display text-lg font-black text-tf-app-fg">
            Infos {clubName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl border border-white/10 text-tf-app-muted transition hover:bg-white/5"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm text-tf-app-fg">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-300/80">Secondaire (démo)</p>
          <p className="text-tf-app-muted">
            Les stats « classiques » (effectif LFP, calendrier officiel) sont volontairement en second plan.
            Ici : rappel coach, stade, prochain rendez-vous.
          </p>
          <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-tf-app-fg">
            <li>
              <span className="text-tf-app-muted">Coach (démo) :</span> {data.infoSummary.coach}
            </li>
            <li>
              <span className="text-tf-app-muted">Stade (générique) :</span> {data.infoSummary.stadium}
            </li>
            <li>
              <span className="text-tf-app-muted">Prochain choc (cal.) :</span> {data.infoSummary.nextOpponent}
            </li>
          </ul>
          <div>
            <p className="mb-2 text-xs font-bold text-tf-app-muted">Palmarès (illustration)</p>
            <ul className="flex flex-wrap gap-2">
              {data.trophies.map((t) => (
                <li
                  key={t.label}
                  className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-200"
                >
                  {t.label} · {t.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex w-full min-h-tf-touch items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-bold text-tf-app-fg transition hover:bg-white/[0.15]',
              TF_FOCUS_VISIBLE,
            )}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
