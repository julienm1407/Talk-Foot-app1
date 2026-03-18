import { cn } from '../../utils/cn'
import type { CompetitionTheme } from '../../data/competitionThemes'

export function LeagueMark({
  theme,
  label,
  className,
}: {
  theme: CompetitionTheme | null
  label: string
  className?: string
}) {
  if (!theme) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide ring-1 ring-slate-200/80',
        theme.labelBg,
        theme.labelText,
        className,
      )}
      style={{
        boxShadow: `0 0 0 2px color-mix(in srgb, ${theme.accent} 22%, transparent)`,
      }}
    >
      <span
        className="inline-flex h-5 w-5 rounded-full ring-1 ring-slate-200/80"
        style={{
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

