import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { CONSENT_DISMISS_SESSION_KEY } from '../../constants/privacyStorage'
import { hasRecordedConsent, recordEssentialConsent } from '../../utils/privacyLocal'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useIsMobileTouchViewport } from '../../hooks/useIsMobileTouchViewport'
import { useT } from '../../contexts/LocaleContext'

/**
 * Information + consentement (stockage local + mention publicité AdSense sur pages éditoriales).
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const { appearance } = useAppearance()
  const t = useT()
  const L = appearance === 'light'
  const isMobileTouch = useIsMobileTouchViewport()
  const { pathname } = useLocation()
  const isChannel = pathname.startsWith('/channel/')
  const liftAboveBottomNav = isMobileTouch && !isChannel

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CONSENT_DISMISS_SESSION_KEY) === '1') {
        setVisible(false)
        return
      }
    } catch {
      /* ignore */
    }
    setVisible(!hasRecordedConsent())
  }, [])

  if (!visible) return null

  const banner = (
    <div
      className={cn(
        'tf-cookie-consent-shell',
        liftAboveBottomNav && 'tf-cookie-consent-shell--above-bottomnav',
      )}
    >
      <div
        className={cn(
          'border-t p-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] sm:p-5',
          liftAboveBottomNav ? 'pb-3' : 'pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
          L ? 'border-tf-dark/10 bg-white/98 backdrop-blur-md' : 'border-white/10 bg-tf-dark/95 backdrop-blur-md',
        )}
        role="dialog"
        aria-labelledby="tf-consent-title"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            <p id="tf-consent-title" className={cn('text-sm font-black', L ? 'text-tf-dark' : 'text-white')}>
              {t('cookies.title')}
            </p>
            <p className={cn('text-xs font-medium leading-snug', L ? 'text-tf-grey' : 'text-slate-300')}>
              {t('cookies.body')}{' '}
              <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                {t('cookies.more')}
              </Link>
              {' · '}
              <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                {t('chrome.terms')}
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                'rounded-xl px-4 py-2.5 text-xs font-black transition sm:text-sm',
                L
                  ? 'border border-tf-dark/20 bg-white text-tf-dark hover:bg-tf-grey-pastel/30'
                  : 'border border-white/25 text-white hover:bg-white/10',
              )}
              onClick={() => {
                try {
                  sessionStorage.setItem(CONSENT_DISMISS_SESSION_KEY, '1')
                } catch {
                  /* ignore */
                }
                setVisible(false)
              }}
            >
              {t('cookies.later')}
            </button>
            <button
              type="button"
              className="rounded-xl bg-tf-cta px-4 py-2.5 text-xs font-black text-white shadow-tf-cta transition hover:bg-tf-cta-hover sm:text-sm"
              onClick={() => {
                recordEssentialConsent()
                setVisible(false)
              }}
            >
              {t('cookies.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(banner, document.body)
  }

  return banner
}
