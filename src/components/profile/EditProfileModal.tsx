import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../contexts/AuthContext'

export function EditProfileModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { user, updateProfile, changePassword } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
      setSuccess(false)
    }
  }, [open, user])

  if (!open) return null

  const isEmailUser = user?.provider === 'email'
  const hasPasswordChange = newPassword.length > 0 || confirmPassword.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const name = displayName.trim() || 'Supporteur'
    let saved = false

    if (name !== (user?.displayName || '')) {
      updateProfile(name)
      saved = true
    }

    if (isEmailUser && hasPasswordChange) {
      if (newPassword.length < 6) {
        setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
      const result = changePassword(currentPassword, newPassword)
      if (!result.ok) {
        setError(result.error || 'Erreur lors du changement.')
        return
      }
      saved = true
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    if (saved) {
      setSuccess(true)
      setTimeout(() => onClose(), 800)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <Card className="relative w-full max-w-[400px] p-5 sm:p-6" elevation="soft">
        <h2 className="font-display text-xl font-black text-tf-dark">
          Modifier le profil
        </h2>
        <p className="mt-1 text-sm font-medium text-tf-grey">
          Nom d&apos;affichage et mot de passe (compte email uniquement)
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="edit-displayName" className="mb-1 block text-xs font-bold text-tf-grey">
              Nom d&apos;affichage
            </label>
            <Input
              id="edit-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ton pseudo"
              autoComplete="username"
              className="rounded-xl border-tf-grey-pastel/50"
            />
          </div>

          {isEmailUser && (
            <>
              <div className="border-t border-tf-grey-pastel/40 pt-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-tf-grey">
                  Changer le mot de passe
                </h3>
                <p className="mt-1 text-[11px] font-medium text-tf-grey">
                  Laisse vide pour ne pas modifier
                </p>
              </div>
              <div>
                <label htmlFor="edit-currentPassword" className="mb-1 block text-xs font-bold text-tf-grey">
                  Mot de passe actuel
                </label>
                <Input
                  id="edit-currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="rounded-xl border-tf-grey-pastel/50"
                  required={hasPasswordChange}
                />
              </div>
              <div>
                <label htmlFor="edit-newPassword" className="mb-1 block text-xs font-bold text-tf-grey">
                  Nouveau mot de passe
                </label>
                <Input
                  id="edit-newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  autoComplete="new-password"
                  className="rounded-xl border-tf-grey-pastel/50"
                />
              </div>
              <div>
                <label htmlFor="edit-confirmPassword" className="mb-1 block text-xs font-bold text-tf-grey">
                  Confirmer le nouveau mot de passe
                </label>
                <Input
                  id="edit-confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="rounded-xl border-tf-grey-pastel/50"
                />
              </div>
            </>
          )}

          {!isEmailUser && (
            <p className="text-xs font-medium text-tf-grey">
              Connexion via {user?.provider === 'google' ? 'Google' : 'Apple'} — changement de mot de passe non disponible.
            </p>
          )}

          {error && (
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          )}
          {success && (
            <p className="text-sm font-semibold text-emerald-600">Modifications enregistrées.</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1 rounded-xl">
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
