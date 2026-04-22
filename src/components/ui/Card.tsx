import { cn } from '../../utils/cn'

export function Card({
  className,
  children,
  elevation = 'soft',
  style,
  id,
  /**
   * `light` (défaut) : carte standard — le fond suit `--tf-card-bg-light` (blanc le jour, verre 30 % la nuit).
   * `dark` : carte verre explicite (même look nuit) — ne pose pas `data-tf-card-surface`.
   */
  surface = 'light',
}: {
  className?: string
  children: React.ReactNode
  elevation?: 'none' | 'soft'
  style?: React.CSSProperties
  id?: string
  surface?: 'light' | 'dark'
}) {
  return (
    <div
      id={id}
      style={style}
      data-tf-card-surface={surface === 'light' ? 'light' : undefined}
      className={cn(
        'rounded-tf-3xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-card-bg-light)_96%,transparent)] text-tf-app-fg backdrop-blur-sm',
        elevation === 'soft' && 'shadow-tf-elev-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
