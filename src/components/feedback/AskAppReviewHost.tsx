import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'

const STORAGE_KEY = 'talkfoot-app-review-asked-v1'
const APP_STORE_URL = 'https://apps.apple.com/app/id6740000000'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.talkfoot.app'

function alreadyAsked(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markAsked() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** Après un prono gagné : demande un avis (iOS / Android / web). */
export function AskAppReviewHost() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onWon = () => {
      if (alreadyAsked()) return
      setOpen(true)
    }
    window.addEventListener('talkfoot-prono-won', onWon)
    return () => window.removeEventListener('talkfoot-prono-won', onWon)
  }, [])

  if (!open) return null

  const native = Capacitor.isNativePlatform()
  const ios = Capacitor.getPlatform() === 'ios'
  const storeUrl = ios ? APP_STORE_URL : PLAY_STORE_URL

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end p-4 sm:place-items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Fermer"
        onClick={() => {
          markAsked()
          setOpen(false)
        }}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-sm rounded-2xl border p-4 shadow-2xl',
          L ? 'border-slate-200 bg-white text-tf-dark' : 'border-white/15 bg-[#0b2440] text-sky-50',
        )}
        role="dialog"
        aria-labelledby="tf-review-title"
      >
        <p id="tf-review-title" className="text-base font-black">
          Prono gagné — un avis ?
        </p>
        <p className={cn('mt-1.5 text-sm font-semibold', L ? 'text-slate-600' : 'text-sky-200/85')}>
          Ça aide Talk Foot à rester visible sur l’App Store et Play Store. Une note suffit.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {native ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tf-cta px-4 text-sm font-black text-white"
              onClick={() => {
                markAsked()
                setOpen(false)
              }}
            >
              Noter l’appli
            </a>
          ) : (
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tf-cta px-4 text-sm font-black text-white"
              onClick={() => {
                markAsked()
                setOpen(false)
              }}
            >
              Noter sur l’App Store
            </a>
          )}
          <button
            type="button"
            className={cn(
              'min-h-11 rounded-xl text-sm font-bold',
              L ? 'text-slate-600' : 'text-sky-200/90',
            )}
            onClick={() => {
              markAsked()
              setOpen(false)
            }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
