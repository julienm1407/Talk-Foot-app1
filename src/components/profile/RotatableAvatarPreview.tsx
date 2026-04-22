import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { ProfileAvatar3DView } from './avatar3d/ProfileAvatar3DView'

/**
 * Aperçu 3D WebGL : rotation 360° (azimut illimité), ombres + HDRI, zoom borné, pas de pan.
 */
export function RotatableAvatarPreview({
  profile,
  className,
}: {
  profile: UserProfile
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <p className="mb-2 max-w-[9rem] text-center text-[10px] font-bold uppercase leading-tight tracking-wider text-tf-grey sm:max-w-none sm:text-left">
        Glisser : tourne autour · zoom arrière-avant · cadrage côté / dos
      </p>
      <ProfileAvatar3DView
        profile={profile}
        className="w-36"
      />
    </div>
  )
}
