import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useLocale } from '../../contexts/LocaleContext'
import { LOCALE_FLAGS } from '../../i18n/messages'
import { APP_LOCALES, type AppLocale } from '../../i18n/types'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

/**
 * Un drapeau cliquable → menu des 5 langues Big 5.
 * Léger : pas de lib i18n, juste de petits dictionnaires texte.
 */
export function LanguageFlagToggle({
  variant = 'compact',
  className,
}: {
  variant?: 'compact' | 'profile'
  className?: string
}) {
  const { locale, setLocale, t } = useLocale()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (next: AppLocale) => {
    setLocale(next)
    setOpen(false)
  }

  const menu = open ? (
    <div
      id={listId}
      role="listbox"
      aria-label={t('language.choose')}
      className={cn(
        'absolute right-0 z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border py-1 shadow-lg',
        L ? 'border-tf-dark/15 bg-white' : 'border-white/15 bg-[#0c2238]',
        variant === 'profile' ? 'left-0 right-auto' : null,
      )}
    >
      {APP_LOCALES.map((code) => {
        const active = locale === code
        return (
          <button
            key={code}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => pick(code)}
            className={cn(
              TF_FOCUS_VISIBLE,
              'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-bold transition',
              active
                ? L
                  ? 'bg-tf-dark/8 text-tf-dark'
                  : 'bg-sky-500/20 text-sky-50'
                : L
                  ? 'text-tf-app-fg hover:bg-tf-dark/[0.05]'
                  : 'text-sky-100 hover:bg-white/8',
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              {LOCALE_FLAGS[code]}
            </span>
            {t(`language.${code}`)}
          </button>
        )
      })}
    </div>
  ) : null

  if (variant === 'profile') {
    return (
      <div className={cn('space-y-3', className)} ref={rootRef}>
        <div>
          <h2 className={cn('font-display text-lg font-black', L ? 'text-tf-app-fg' : 'text-sky-100')}>
            {t('profile.languageTitle')}
          </h2>
          <p className={cn('mt-1 text-sm font-medium', L ? 'text-tf-app-muted' : 'text-sky-200/90')}>
            {t('profile.languageHint')}
          </p>
        </div>
        <div className="relative inline-block">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              TF_FOCUS_VISIBLE,
              'inline-flex min-h-tf-touch items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-black transition',
              L
                ? 'border-tf-dark/15 bg-white text-tf-app-fg hover:border-tf-dark/35'
                : 'border-white/15 bg-white/5 text-sky-100 hover:border-white/30',
            )}
          >
            <span className="text-xl leading-none" aria-hidden>
              {LOCALE_FLAGS[locale]}
            </span>
            {t(`language.${locale}`)}
            <span className="opacity-60" aria-hidden>
              ▾
            </span>
          </button>
          {menu}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative shrink-0', className)} ref={rootRef}>
      <button
        type="button"
        title={t('language.choose')}
        aria-label={`${t('language.choose')}: ${t(`language.${locale}`)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          TF_FOCUS_VISIBLE,
          'grid h-8 w-8 place-items-center rounded-full border text-base leading-none transition',
          L
            ? 'border-tf-dark/15 bg-white/80 hover:bg-tf-dark/[0.06]'
            : 'border-white/15 bg-black/25 hover:bg-white/10',
          open && (L ? 'ring-1 ring-tf-dark/25' : 'ring-1 ring-white/30'),
        )}
      >
        <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
      </button>
      {menu}
    </div>
  )
}
