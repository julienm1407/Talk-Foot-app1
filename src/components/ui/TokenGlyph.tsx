import { cn } from '../../utils/cn'

const PALETTE = {
  /** Fonds clairs (cartes, boutons) */
  solid: {
    outer: '#059669',
    outerStroke: '#047857',
    ring: '#a7f3d0',
    ring2: '#6ee7b7',
    hub: '#ecfdf5',
    hubOp: 0.3,
  },
  /** Fonds sombres (hero, panneaux encart) */
  onDark: {
    outer: '#34d399',
    outerStroke: '#6ee7b7',
    ring: '#ecfdf5',
    ring2: '#d1fae5',
    hub: '#ffffff',
    hubOp: 0.2,
  },
} as const

/**
 * Jeton de pari (pastille type chip) — représentation visuelle des jetons, pas un dé.
 */
export function TokenGlyph({
  className,
  variant = 'solid',
}: {
  className?: string
  variant?: keyof typeof PALETTE
}) {
  const c = PALETTE[variant]
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('inline-block size-[1em] shrink-0 align-[-0.12em]', className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10.25" fill={c.outer} stroke={c.outerStroke} strokeWidth="1.05" />
      <circle cx="12" cy="12" r="7.35" fill="none" stroke={c.ring} strokeWidth="1.05" opacity={0.95} />
      <circle cx="12" cy="12" r="4.6" fill="none" stroke={c.ring2} strokeWidth="0.75" opacity={0.65} />
      <circle cx="12" cy="12" r="2.35" fill={c.hub} opacity={Math.min(0.45, c.hubOp + 0.12)} />
    </svg>
  )
}
