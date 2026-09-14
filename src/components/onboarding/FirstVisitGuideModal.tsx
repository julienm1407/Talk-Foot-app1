import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import {
  FIRST_VISIT_GUIDES,
  firstVisitGuideIdFromPath,
} from '../../data/firstVisitGuides'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { hasSeenFirstVisitGuide, markFirstVisitGuideSeen } from '../../utils/firstVisitGuidesStorage'

const FORCE_QUERY = 'tuto'

export function FirstVisitGuideModal() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { onboardingOpen } = useFanPreferences()
  const [open, setOpen] = useState(false)
  const guideId = firstVisitGuideIdFromPath(location.pathname)
  const force = params.get(FORCE_QUERY) === '1'
  const guide = guideId ? FIRST_VISIT_GUIDES[guideId] : null

  useEffect(() => {
    if (onboardingOpen || !guideId || !guide) {
      setOpen(false)
      return
    }
    const should = force || !hasSeenFirstVisitGuide(guideId)
    if (!should) {
      setOpen(false)
      return
    }
    const t = window.setTimeout(() => setOpen(true), 450)
    return () => window.clearTimeout(t)
  }, [guideId, guide, force, onboardingOpen, location.pathname])

  const dismiss = (remember: boolean) => {
    if (remember && guideId) markFirstVisitGuideSeen(guideId)
    setOpen(false)
    if (force) {
      const next = new URLSearchParams(params)
      next.delete(FORCE_QUERY)
      const q = next.toString()
      navigate({ pathname: location.pathname, search: q ? `?${q}` : '', hash: location.hash }, { replace: true })
    }
  }

  if (!open || !guide || !guideId) return null

  const portalTarget = getModalPortalRoot()
  if (!portalTarget) return null

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[2] flex touch-manipulation items-end justify-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]',
        'sm:items-center',
      )}
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tf-first-visit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => dismiss(true)}
        aria-label="Fermer le mini-tuto"
      />
      <div className="relative z-10 w-full max-w-[22rem] overflow-hidden rounded-[28px] border border-white/20 bg-tf-white text-tf-dark shadow-[0_28px_80px_rgba(1,30,51,0.32)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-violet-500 to-amber-400" />
        <div className="space-y-3 px-5 pb-5 pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
            {guide.eyebrow} · première visite
          </p>
          <h2
            id="tf-first-visit-title"
            className="font-display text-[1.65rem] font-black leading-tight tracking-tight text-tf-dark"
          >
            {guide.title}
          </h2>
          <p className="text-[15px] font-semibold leading-relaxed text-slate-600">{guide.body}</p>
          <ul className="space-y-2 pt-0.5 text-[14px] font-semibold leading-snug text-tf-dark">
            {guide.bullets.map((b) => (
              <li key={b} className="flex gap-2.5">
                <span className="mt-px font-black text-sky-600" aria-hidden>
                  ·
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="pt-1 text-[11px] font-semibold text-tf-grey">Une seule fois sur cet écran.</p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tf-dark px-4 text-sm font-black text-white shadow-md transition hover:bg-tf-dark-alt',
              )}
              onClick={() => dismiss(true)}
            >
              Compris
            </button>
            <button
              type="button"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-bold text-tf-grey transition hover:text-tf-dark',
              )}
              onClick={() => dismiss(true)}
            >
              Passer
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
