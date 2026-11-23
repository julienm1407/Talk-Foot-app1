import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import {
  WHATS_NEW_RELEASE,
  nativeBuildIsBehind,
  shouldShowWhatsNew,
} from '../../data/whatsNewRelease'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useAuth } from '../../contexts/AuthContext'
import { hasSeenFirstVisitGuide } from '../../utils/firstVisitGuidesStorage'
import { hasSnoozedWhatsNew, markWhatsNewSnoozed } from '../../utils/whatsNewStorage'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { LogoEncart } from '../../layout/LogoMark'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { preferredStoreUrl } from '../../config/appStores'

export function WhatsNewFestiveModal() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { onboardingOpen } = useFanPreferences()
  const { user, isReady } = useAuth()
  const [open, setOpen] = useState(false)
  const force = params.get('maj') === '1'
  const isHome = location.pathname === '/' || location.pathname === ''
  const release = WHATS_NEW_RELEASE
  const native = Capacitor.isNativePlatform()
  const store = preferredStoreUrl()

  useEffect(() => {
    let cancelled = false
    if (!isReady) {
      setOpen(false)
      return
    }

    const run = async () => {
      let updateNeeded = false
      if (native) {
        try {
          const info = await App.getInfo()
          const build = Number.parseInt(String(info.build), 10)
          updateNeeded = Number.isFinite(build)
            ? nativeBuildIsBehind({
                platform: Capacitor.getPlatform(),
                build,
                requiredAndroidVersionCode: release.requiredAndroidVersionCode,
                requiredIosBuild: release.requiredIosBuild,
              })
            : false
        } catch {
          updateNeeded = false
        }
      }

      const firstVisitHomePending = !user || user.isAnonymous ? !hasSeenFirstVisitGuide('home') : false
      const should = shouldShowWhatsNew({
        force,
        native,
        updateNeeded,
        snoozed: hasSnoozedWhatsNew(release.id),
        onboardingOpen,
        isHome,
        firstVisitHomePending,
      })
      if (cancelled) return
      if (!should) {
        setOpen(false)
        return
      }
      window.setTimeout(() => {
        if (!cancelled) setOpen(true)
      }, force ? 120 : 700)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isReady, user, onboardingOpen, isHome, force, native, release.id, location.pathname])

  const dismiss = () => {
    markWhatsNewSnoozed(release.id)
    setOpen(false)
    if (force) {
      const next = new URLSearchParams(params)
      next.delete('maj')
      const q = next.toString()
      navigate({ pathname: location.pathname, search: q ? `?${q}` : '', hash: location.hash }, { replace: true })
    }
  }

  if (!open) return null

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
      aria-labelledby="tf-whats-new-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#011e33]/70 backdrop-blur-[3px]"
        onClick={dismiss}
        aria-label="Fermer"
      />
      <div className="relative z-10 w-full max-w-[22.5rem] overflow-hidden rounded-[28px] border border-white/20 bg-tf-white text-tf-dark shadow-[0_28px_80px_rgba(1,30,51,0.4)] tf-modal-pop-in">
        <div className="relative h-20 overflow-hidden bg-gradient-to-br from-[#023458] to-[#0b4a7a]">
          <div className="relative flex h-full items-center justify-center">
            <LogoEncart size="lg" isLight={false} />
          </div>
        </div>
        <div className="space-y-3 px-5 pb-5 pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
            {release.eyebrow} · {release.versionLabel}
          </p>
          <h2
            id="tf-whats-new-title"
            className="font-display text-[1.65rem] font-black leading-tight tracking-tight text-tf-dark"
          >
            {release.title}
          </h2>
          <p className="text-[15px] font-semibold leading-relaxed text-slate-600">{release.subtitle}</p>
          <ul className="space-y-2 pt-0.5 text-[14px] font-semibold leading-snug text-tf-dark">
            {release.highlights.map((b) => (
              <li key={b} className="flex gap-2.5">
                <span className="mt-px font-black text-sky-600" aria-hidden>
                  ·
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <a
            href={store.primary.href}
            className={cn(
              TF_FOCUS_VISIBLE,
              'mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tf-cta px-4 text-sm font-black text-white shadow-md',
            )}
            onClick={dismiss}
          >
            Mettre à jour l’appli
          </a>
          <button
            type="button"
            className={cn(
              TF_FOCUS_VISIBLE,
              'inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tf-dark px-4 text-sm font-black text-white shadow-md',
            )}
            onClick={dismiss}
          >
            {release.cta}
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
