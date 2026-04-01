import { cn } from '../../utils/cn'

export function Card({
  className,
  children,
  elevation = 'soft',
  style,
  id,
  /**
   * `light` : carte fond blanc cassé (défaut) — corrige le contraste des `text-tf-app-*` quand l’app est en mode nuit.
   * `dark` : carte « verre » sombre (ex. rail hub) — garder texte clair, ne pas appliquer la correction.
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
        'rounded-tf-3xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-card-bg-light)_96%,transparent)] text-tf-dark backdrop-blur-sm',
        elevation === 'soft' && 'shadow-tf-elev-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
