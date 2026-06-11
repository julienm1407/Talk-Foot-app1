import type { CSSProperties } from 'react'
import { cn } from '../../utils/cn'

function compactPlayerLabel(name: string, maxLen = 12) {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Joueur'
  const parts = cleaned.split(' ')
  const last = parts[parts.length - 1] ?? cleaned
  const candidate = last.length >= 3 ? last : cleaned
  return candidate.length > maxLen ? `${candidate.slice(0, maxLen - 1)}…` : candidate
}

function PlayerBadge({
  name,
  className,
  style,
  light,
}: {
  name: string
  className?: string
  style?: CSSProperties
  light?: boolean
}) {
  return (
    <div
      className={cn(
        'absolute max-w-[44%] truncate rounded-md border px-1.5 py-1 text-[10px] font-bold leading-tight backdrop-blur-[1px]',
        light
          ? 'border-sky-400/40 bg-white/95 text-[#023458] shadow-[0_4px_12px_rgba(15,40,70,0.12)]'
          : 'border-cyan-200/55 bg-[#062235]/92 text-sky-50 shadow-[0_4px_10px_rgba(0,0,0,0.35)]',
        className,
      )}
      style={style}
      title={name}
    >
      {compactPlayerLabel(name)}
    </div>
  )
}

export function MatchLineupPitch({
  badges,
  homeToneColor,
  awayToneColor,
  isUpcoming,
  light,
  className,
}: {
  badges: Array<{ name: string; left: number; top: number }>
  homeToneColor: string
  awayToneColor: string
  isUpcoming?: boolean
  light?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'tf-lineup-pitch relative overflow-hidden rounded-lg border border-emerald-300/35 bg-[#14543f]',
        isUpcoming ? 'h-[200px] md:h-[min(28vh,200px)]' : 'h-[250px] md:h-[min(34vh,250px)]',
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
          key={`lineup-badge-${i}-${p.name}`}
          name={p.name}
          light={light}
          className="-translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
        />
      ))}
    </div>
  )
}
