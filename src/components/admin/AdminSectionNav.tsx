import { ADMIN_SECTIONS, type AdminSectionId } from './adminSections'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

type AdminSectionNavProps = {
  active: AdminSectionId
  onChange: (id: AdminSectionId) => void
  badges?: Partial<Record<AdminSectionId, number>>
}

export function AdminSectionNav({ active, onChange, badges }: AdminSectionNavProps) {
  return (
    <nav
      aria-label="Sections administration"
      className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {ADMIN_SECTIONS.map((section) => {
        const isActive = active === section.id
        const badge = badges?.[section.id] ?? 0
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={cn(
              TF_FOCUS_VISIBLE,
              'flex min-w-[9.5rem] shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition lg:min-w-0 lg:w-full',
              isActive
                ? 'border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500',
            )}
          >
            <span>
              <span className="block text-sm font-black text-tf-dark dark:text-slate-100">{section.label}</span>
              <span className="mt-0.5 hidden text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400 lg:block">
                {section.description}
              </span>
            </span>
            {badge > 0 ? (
              <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
