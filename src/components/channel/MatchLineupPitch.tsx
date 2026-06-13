import type { CSSProperties } from 'react'
import { cn } from '../../utils/cn'

function playerDisplayLabel(name: string, number?: string, compact?: boolean) {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return number ? `#${number}` : 'Joueur'
  const parts = cleaned.split(' ')
  const last = parts[parts.length - 1] ?? cleaned
  const surname = last.length >= 2 ? last : cleaned
  const maxLen = compact ? 11 : 14
  const trimmed = surname.length > maxLen ? `${surname.slice(0, maxLen - 1)}…` : surname
  return number ? `${number} ${trimmed}` : trimmed
}

function PlayerBadge({
  name,
  number,
  className,
  style,
  light,
  compact,
  maxWidthPct,
}: {
  name: string
  number?: string
  className?: string
  style?: CSSProperties
  light?: boolean
  compact?: boolean
  maxWidthPct?: number
}) {
  return (
    <div
      className={cn(
        'absolute rounded-md border font-bold leading-tight backdrop-blur-[1px]',
        compact
          ? 'px-1 py-0.5 text-[7px] sm:text-[8px]'
          : 'px-1.5 py-1 text-[9px] sm:text-[10px]',
        light
          ? 'border-sky-400/40 bg-white/95 text-[#023458] shadow-[0_4px_12px_rgba(15,40,70,0.12)]'
          : 'border-cyan-200/55 bg-[#062235]/92 text-sky-50 shadow-[0_4px_10px_rgba(0,0,0,0.35)]',
        className,
      )}
      style={{
        ...style,
        maxWidth: maxWidthPct ? `${maxWidthPct}%` : compact ? '30%' : '34%',
        whiteSpace: 'normal',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
      title={number ? `#${number} ${name}` : name}
    >
      {playerDisplayLabel(name, number, compact)}
    </div>
  )
}

export function MatchLineupPitch({
  badges,
  homeToneColor,
  awayToneColor,
  isUpcoming,
  light,
  compact,
  className,
}: {
  badges: Array<{ name: string; number?: string; left: number; top: number; maxWidthPct?: number }>
  homeToneColor: string
  awayToneColor: string
  isUpcoming?: boolean
  light?: boolean
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'tf-lineup-pitch relative overflow-hidden rounded-lg border border-emerald-300/35 bg-[#14543f]',
        compact
          ? 'aspect-[3/4] min-h-[220px] w-full'
          : isUpcoming
            ? 'h-[220px] md:h-[min(30vh,220px)]'
            : 'h-[270px] md:h-[min(36vh,270px)]',
        className,
      )}
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${homeToneColor} 24%, #14543f) 0%, #14543f 46%, color-mix(in srgb, ${awayToneColor} 22%, #14543f) 100%)`,
      }}
    >
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/15" />
      <div className="absolute left-7 right-7 top-5 h-[41%] rounded-md border border-white/20" />
      <div className="absolute bottom-5 left-7 right-7 h-[41%] rounded-md border border-white/20" />

      {badges.map((p, i) => (
        <PlayerBadge
          key={`lineup-badge-${i}-${p.number ?? ''}-${p.name}`}
          name={p.name}
          number={p.number}
          light={light}
          compact={compact}
          maxWidthPct={p.maxWidthPct}
          className="-translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
        />
      ))}
    </div>
  )
}
