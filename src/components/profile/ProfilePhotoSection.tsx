import { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
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

  const hasPhoto = Boolean(profile.profilePhotoDataUrl)

  return (
    <Card className="p-5 sm:p-6" elevation="soft">
      <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">PHOTO DE PROFIL</div>
      <p className="mt-1 text-sm font-semibold text-tf-grey">
        Optionnelle : une <strong>photo perso</strong> (portrait, selfie…), stockée ici, distincte de ton{' '}
        <strong>personnage 3D</strong> in-app. Les avatars, menus et listes affichent ton look Talk Foot, pas
        ce fichier, sauf dans cet aperçu.
      </p>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            'relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 sm:h-28 sm:w-28',
            hasPhoto
              ? 'border-tf-grey-pastel/50 bg-tf-white'
              : 'border-dashed border-tf-grey-pastel/80 bg-tf-grey-pastel/10',
          )}
          role="img"
          aria-label={hasPhoto ? `Aperçu de ta photo — ${usernameLabel}` : 'Aucune photo personnelle'}
        >
          {hasPhoto && profile.profilePhotoDataUrl ? (
            <img
              src={profile.profilePhotoDataUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="px-2 text-center text-[10px] font-bold leading-snug text-tf-grey/90">
              Aperçu photo
              <span className="mt-0.5 block text-[9px] font-medium opacity-80">(facultatif)</span>
            </span>
          )}
        </div>
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
              {busy ? 'Traitement…' : hasPhoto ? 'Changer la photo' : 'Ajouter une photo'}
            </Button>
            {hasPhoto ? (
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
                Retirer la photo
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className={cn('text-xs font-semibold text-rose-600')} role="alert">
              {error}
            </p>
          ) : (
            <p className="text-xs font-medium text-tf-grey">
              JPG / PNG / WebP — redimensionnée automatiquement. L’apparence du personnage 3D (encart Apparence
              ci-dessous) reste inchangée.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
