import { useMemo } from 'react'
import { cn } from '../../utils/cn'

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function paletteFromSeed(seed: string) {
  const h = hashSeed(seed)
  const hues = [43, 199, 168, 262, 12, 330]
  const hue = hues[h % hues.length]
  return {
    ring: `hsl(${hue} 72% 48%)`,
    face: `hsl(${hue} 35% 92%)`,
    cheek: `hsl(${hue} 55% 78%)`,
  }
}

/**
 * Tête bot minimaliste (SVG) — une par tribune, sans avatar modulaire lourd.
 */
export function SalonBotHeadThumb({
  seed,
  groupEmoji,
  kind = 'salon',
  className,
  'aria-label': ariaLabel,
}: {
  /** Id groupe ou identifiant stable (détermine les couleurs). */
  seed: string
  groupEmoji?: string
  kind?: 'salon' | 'coach'
  className?: string
  'aria-label'?: string
}) {
  const colors = useMemo(
    () =>
      kind === 'coach'
        ? { ring: '#7c3aed', face: '#ede9fe', cheek: '#c4b5fd' }
        : paletteFromSeed(seed),
    [seed, kind],
  )

  const eyeOffset = useMemo(() => (hashSeed(`${seed}:eyes`) % 3) - 1, [seed])

  return (
    <div
      className={cn(
        'relative grid size-full place-items-center overflow-hidden rounded-full border-2 shadow-[0_4px_14px_rgba(1,30,51,0.12)]',
        kind === 'coach' ? 'border-violet-400/80' : 'border-tf-cdm-gold/75 tf-salon-bot-thumb',
        className,
      )}
      role="img"
      aria-label={ariaLabel ?? 'Assistant tribune'}
    >
      <svg
        viewBox="0 0 48 48"
        className="size-full"
        aria-hidden
      >
        <circle cx="24" cy="24" r="22" fill={colors.ring} />
        <circle cx="24" cy="25" r="17" fill={colors.face} />
        <ellipse cx="24" cy="30" rx="9" ry="5" fill={colors.cheek} opacity="0.35" />
        <circle cx={17 + eyeOffset} cy="22" r="2.2" fill="#0f172a" />
        <circle cx={31 - eyeOffset} cy="22" r="2.2" fill="#0f172a" />
        <path
          d="M 18 28 Q 24 32 30 28"
          fill="none"
          stroke="#0f172a"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {kind === 'coach' ? (
          <path d="M 14 14 L 24 9 L 34 14 L 32 17 L 16 17 Z" fill={colors.ring} />
        ) : (
          <circle cx="24" cy="10" r="3" fill={colors.ring} />
        )}
      </svg>
      {groupEmoji && kind === 'salon' ? (
        <span
          className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[11px] leading-none drop-shadow-sm"
          aria-hidden
        >
          {groupEmoji}
        </span>
      ) : null}
      {kind === 'salon' ? (
        <span
          className="pointer-events-none absolute -bottom-0.5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-tf-cdm-gold/50 bg-tf-cdm-deep px-1 py-px text-[7px] font-black uppercase tracking-wider text-tf-cdm-gold shadow-sm"
          aria-hidden
        >
          Bot
        </span>
      ) : null}
    </div>
  )
}
