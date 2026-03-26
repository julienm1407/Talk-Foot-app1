import { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProfileCharacterThumb } from './ProfileCharacterThumb'
import { useProfile } from '../../hooks/useProfile'
import { fileToProfilePhotoDataUrl } from '../../utils/profilePhoto'
import { cn } from '../../utils/cn'

export function ProfilePhotoSection({ usernameLabel }: { usernameLabel: string }) {
  const { profile, setProfilePhotoDataUrl } = useProfile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = () => {
    setError(null)
    inputRef.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await fileToProfilePhotoDataUrl(file)
      setProfilePhotoDataUrl(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’utiliser cette image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6" elevation="soft">
      <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">PHOTO DE PROFIL</div>
      <p className="mt-1 text-sm font-semibold text-tf-grey">
        Visible dans le menu, les chats, les classements et les commentaires — à jour partout tout de suite.
      </p>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <ProfileCharacterThumb
          profile={profile}
          size="lg"
          aria-label={`Aperçu — ${usernameLabel}`}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onFile}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              className="rounded-2xl"
              disabled={busy}
              onClick={pick}
            >
              {busy ? 'Traitement…' : profile.profilePhotoDataUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </Button>
            {profile.profilePhotoDataUrl ? (
              <Button
                type="button"
                variant="soft"
                className="rounded-2xl"
                disabled={busy}
                onClick={() => {
                  setError(null)
                  setProfilePhotoDataUrl(null)
                }}
              >
                Revenir au personnage
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className={cn('text-xs font-semibold text-rose-600')} role="alert">
              {error}
            </p>
          ) : (
            <p className="text-xs font-medium text-tf-grey">
              JPG / PNG / WebP — redimensionnée automatiquement. Ton avatar 3D reste disponible si tu supprimes la photo.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
