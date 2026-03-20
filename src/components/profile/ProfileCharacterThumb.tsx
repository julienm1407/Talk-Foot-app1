import { DressableCharacter } from './DressableCharacter'
import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'

const PRESETS = {
  /** Compact (lignes stats, listes) */
  sm: { box: 'h-12 w-12 min-h-12 min-w-12', scale: 0.44 },
  /** Carte profil, en-têtes */
  md: { box: 'h-16 w-16 min-h-16 min-w-16', scale: 0.56 },
  /** Bloc éditeur à côté de la vue 3D */
  lg: { box: 'h-24 w-24 min-h-24 min-w-24 sm:h-28 sm:w-28', scale: 0.72 },
} as const

/**
 * Miniature du personnage SVG (même rendu que la preview 3D / live) — remplace la photo DiceBear.
 */
export function ProfileCharacterThumb({
  profile,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  profile: UserProfile
  size?: keyof typeof PRESETS
  className?: string
  'aria-label'?: string
}) {
  const p = PRESETS[size]
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[22px] border-2 border-tf-grey-pastel/50 bg-gradient-to-b from-tf-grey-pastel/25 to-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]',
        p.box,
        className,
      )}
      role="img"
      aria-label={ariaLabel ?? 'Mon personnage Talk Foot'}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0"
        style={{
          transform: `translateX(-50%) scale(${p.scale})`,
          transformOrigin: 'top center',
        }}
      >
        <DressableCharacter profile={profile} variant="front" />
      </div>
    </div>
  )
}
