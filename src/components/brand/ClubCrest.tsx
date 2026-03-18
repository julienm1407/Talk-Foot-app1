import { cn } from '../../utils/cn'

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function ClubCrest({
  id,
  shortName,
  colors,
  size = 40,
  className,
}: {
  id: string
  shortName: string
  colors: { primary: string; secondary: string }
  size?: number
  className?: string
}) {
  const h = hash(id + shortName)
  const variant = h % 3
  const ring = `rgba(148,163,184,0.75)`

  const bg =
    variant === 0
      ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
      : variant === 1
        ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}), radial-gradient(18px 18px at 70% 30%, ${colors.secondary}aa, transparent 60%)`
        : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}), repeating-linear-gradient(135deg, rgba(255,255,255,0.22) 0 8px, rgba(255,255,255,0) 8px 16px)`

  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden rounded-3xl shadow-sm',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        border: `1px solid ${ring}`,
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/18 to-transparent" />
      <div className="relative px-2 text-[12px] font-black tracking-tight text-white/95">
        {shortName}
      </div>
      <div
        className="pointer-events-none absolute -right-3 -top-3 size-10 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), transparent 60%)`,
          opacity: 0.55,
        }}
      />
    </div>
  )
}

