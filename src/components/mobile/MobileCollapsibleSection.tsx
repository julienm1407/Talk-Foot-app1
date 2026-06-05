import { useId, useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { useAppearance } from '../../contexts/AppearanceContext'

/**
 * Section mobile : en-tête compact (+/−) + aperçu d’un élément + suite au tap.
 */
export function MobileCollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  preview,
  children,
  className,
}: {
  title: string
  subtitle?: string
  badge?: string
  defaultOpen?: boolean
  preview?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const hasMore = Boolean(children)

  const headerInner = (
    <>
      {hasMore ? (
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-lg text-xs font-black transition',
            open
              ? L
                ? 'bg-sky-100 text-sky-800'
                : 'bg-sky-500/20 text-sky-200'
              : L
                ? 'bg-tf-dark/[0.06] text-tf-dark/70'
                : 'bg-white/10 text-white/80',
          )}
          aria-hidden
        >
          {open ? '−' : '+'}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-tf-app-fg">{title}</span>
          {badge ? (
            <span className="rounded-full bg-tf-cta/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
              {badge}
            </span>
          ) : null}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-tf-app-muted">{subtitle}</span>
        ) : null}
      </span>
    </>
  )

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm',
        L ? 'border-tf-dark/12 bg-white/95' : 'border-white/10 bg-white/[0.04]',
        className,
      )}
    >
      {hasMore ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            TF_FOCUS_VISIBLE,
            'flex w-full min-h-tf-touch items-center gap-3 px-4 py-3 text-left transition active:scale-[0.995]',
            L ? 'hover:bg-tf-dark/[0.04]' : 'hover:bg-white/[0.04]',
          )}
        >
          {headerInner}
        </button>
      ) : (
        <div className="px-4 py-3">{headerInner}</div>
      )}

      {preview ? <div className="px-3 pb-3 pt-0">{preview}</div> : null}

      {open && children ? (
        <div
          id={panelId}
          className={cn(
            'border-t px-3 pb-3 pt-2',
            L ? 'border-tf-dark/10' : 'border-white/10',
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
