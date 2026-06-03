import { Card } from '../ui/Card'
import { useProfile } from '../../hooks/useProfile'
import { MODULAR_PP_NAV_FRAMING, ProfileCharacterThumb } from './ProfileCharacterThumb'

export function ProfilePhotoSection({ usernameLabel }: { usernameLabel: string }) {
  const { profile } = useProfile()

  return (
    <Card className="p-5 sm:p-6" elevation="soft">
      <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">PHOTO DE PROFIL</div>
      <p className="mt-1 text-sm font-semibold text-tf-grey">
        La photo de profil utilise ton <strong>personnage Talk Foot</strong>. Cette section affiche le même rendu que dans la
        navigation et les listes.
      </p>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <ProfileCharacterThumb
          profile={profile}
          size="lg"
          {...MODULAR_PP_NAV_FRAMING}
          className="!h-24 !w-24 !min-h-24 !min-w-24 shrink-0 rounded-full border-0 p-0 ring-2 ring-white/25 sm:!h-28 sm:!w-28 sm:!min-h-28 sm:!min-w-28"
          aria-label={`Photo de profil Talk Foot — ${usernameLabel}`}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs font-medium text-tf-grey">
            La photo perso est désactivée. Ton profil affiche uniquement la version avatar Talk Foot.
          </p>
        </div>
      </div>
    </Card>
  )
}
