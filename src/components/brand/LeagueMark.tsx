import { cn } from '../../utils/cn'
import type { CompetitionTheme } from '../../data/competitionThemes'
import { getLeagueLogoUrl } from '../../utils/catalogLogos'
import { SafeLogoImg } from '../fan/SafeLogoImg'

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
  const logoUrl = getLeagueLogoUrl(theme.id)
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
      {logoUrl ? (
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200/80">
          <SafeLogoImg src={logoUrl} alt="" className="h-[80%] w-[80%]" />
        </span>
      ) : null}
      {label}
    </span>
  )
}

