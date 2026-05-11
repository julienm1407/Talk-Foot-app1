import { cn } from '../../utils/cn'
import { motion, useReducedMotion } from 'framer-motion'

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
  /**
   * `solid` : fond `--tf-c30-surface-soft` opaque (pas de mix transparent) — tableaux / données denses,
   * pour éviter le « bleu sur bleu » sur panneau nuit ou le fond qui tire le dégradé page en jour.
   */
  tone = 'default',
}: {
  className?: string
  children: React.ReactNode
  elevation?: 'none' | 'soft'
  style?: React.CSSProperties
  id?: string
  surface?: 'light' | 'dark'
  tone?: 'default' | 'solid'
}) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      id={id}
      style={style}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      data-tf-card-surface={surface === 'light' ? 'light' : undefined}
      data-tf-card-tone={tone === 'solid' ? 'solid' : undefined}
      className={cn(
        'rounded-tf-3xl border border-[color:var(--tf-c30-border)] text-tf-app-fg backdrop-blur-sm',
        tone === 'solid'
          ? 'bg-[color:var(--tf-c30-surface-soft)]'
          : 'bg-[color:color-mix(in_srgb,var(--tf-card-bg-light)_96%,transparent)]',
        elevation === 'soft' && 'shadow-tf-elev-3',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
