import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

type Accent = 'violet' | 'emerald' | 'rose' | 'amber'

/**
 * Affichage ciblé d’une **image** (data URL) ou d’un `Avatar` à initiale.
 * L’identité in-app (personnage 3D) passe par `ProfileCharacterThumb`, pas par ce composant.
 */
export function ProfilePhotoAvatar({
  photoDataUrl,
  seed,
  accent,
  alt,
  className,
}: {
  photoDataUrl?: string | null
  seed: string
  accent: Accent
  alt: string
  className?: string
}) {
  if (photoDataUrl) {
    return (
      <div
        className={cn(
          'shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,.35)]',
          className,
        )}
        aria-label={alt}
      >
        <img
          src={photoDataUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }
  return <Avatar seed={seed} accent={accent} alt={alt} className={className} />
}
