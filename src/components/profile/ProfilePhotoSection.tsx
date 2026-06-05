import { Card } from '../ui/Card'
import { useProfile } from '../../hooks/useProfile'
import { MODULAR_PP_NAV_FRAMING, ProfileCharacterThumb } from './ProfileCharacterThumb'

export function ProfilePhotoSection({ usernameLabel }: { usernameLabel: string }) {
  const { profile } = useProfile()

  return (
    <Card className="p-5 sm:p-6" elevation="soft">
      <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">PHOTO DE PROFIL</div>
      <div className="mt-4">
        <ProfileCharacterThumb
          profile={profile}
          size="lg"
          {...MODULAR_PP_NAV_FRAMING}
          className="!h-24 !w-24 !min-h-24 !min-w-24 shrink-0 rounded-full border-0 p-0 ring-2 ring-white/25 sm:!h-28 sm:!w-28 sm:!min-h-28 sm:!min-w-28"
          aria-label={`Photo de profil Talk Foot — ${usernameLabel}`}
        />
      </div>
    </Card>
  )
}
