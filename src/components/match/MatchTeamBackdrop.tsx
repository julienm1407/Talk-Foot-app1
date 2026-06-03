import { cn } from '../../utils/cn'

export function patternFor(seed: string): 0 | 1 | 2 | 3 {
  let h = 0
  for (let i = 0; i < seed.length; i++) h ^= seed.charCodeAt(i)
  return (h % 4) as 0 | 1 | 2 | 3
}

export function MatchTeamBackdrop({
  color,
  color2,
  pattern,
  side,
  monogram,
  monoFont,
}: {
  color: string
  color2: string
  pattern: 0 | 1 | 2 | 3
  side: 'home' | 'away'
  monogram: string
  monoFont: string
}) {
  const mask =
    side === 'home'
      ? 'linear-gradient(90deg, black 0%, black 38%, transparent 48%)'
      : 'linear-gradient(270deg, black 0%, black 38%, transparent 48%)'

  return (
    <div
      className="absolute inset-0"
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <TeamPattern color={color} color2={color2} pattern={pattern} />
      <div
        className={cn(
          'absolute inset-0 flex items-center',
          side === 'home' ? 'justify-start pl-4' : 'justify-end pr-4',
        )}
        style={{
          color: `${color}55`,
          fontSize: monoFont,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          letterSpacing: '-0.02em',
        }}
      >
        {monogram}
      </div>
    </div>
  )
}

function TeamPattern({
  color,
  color2,
  pattern,
}: {
  color: string
  color2: string
  pattern: 0 | 1 | 2 | 3
}) {
  const c1 = `${color}50`
  const c2 = `${color2}35`
  if (pattern === 0) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            105deg,
            ${c1} 0px, ${c1} 4px, ${c2} 4px, ${c2} 8px
          )`,
        }}
      />
    )
  }
  if (pattern === 1) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-radial-gradient(
            circle at 0 0,
            ${c1} 0,
            ${c1} 2px,
            transparent 2px,
            transparent 14px
          ), repeating-radial-gradient(
            circle at 14px 14px,
            ${c2} 0,
            ${c2} 2px,
            transparent 2px,
            transparent 14px
          )`,
          backgroundSize: '28px 28px',
        }}
      />
    )
  }
  if (pattern === 2) {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${c1} 1px, transparent 1px),
            linear-gradient(90deg, ${c1} 1px, transparent 1px)`,
          backgroundSize: '10px 10px',
        }}
      />
    )
  }
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 6px,
            ${c1} 6px,
            ${c1} 7px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 6px,
            ${c2} 6px,
            ${c2} 7px
          )`,
      }}
    />
  )
}
