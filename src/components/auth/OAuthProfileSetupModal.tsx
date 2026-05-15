import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { isTalkFootOAuthProvider, oauthProviderDisplayName } from '../../config/oauthProviders'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useOptionalCloudUserState } from '../../contexts/CloudUserStateContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn } from '../../utils/cn'
import { LogoMark } from '../../layout/LogoMark'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../../utils/bannedWords'

/**
 * Première connexion Google / Apple (Supabase) : pseudo + ligne perso avant le reste de l’app.
 */
export function OAuthProfileSetupModal() {
  const cloud = useOptionalCloudUserState()
  const { user } = useAuth()
  const { preferencesComplete, openOnboarding } = useFanPreferences()
  const [displayName, setDisplayName] = useState('')
  const [aboutLine, setAboutLine] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!cloud?.oauthNeedsProfile || !user) return
    setDisplayName(user.displayName || '')
    setAboutLine(cloud.app.profile.aboutLine ?? '')
    setError(null)
  }, [cloud?.oauthNeedsProfile, user?.id, user?.displayName, cloud?.app.profile.aboutLine])

  if (!cloud?.oauthNeedsProfile) return null

  const providerLabel =
    user?.provider && isTalkFootOAuthProvider(user.provider)
      ? oauthProviderDisplayName(user.provider)
      : 'Google'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = displayName.trim()
    if (name.length < 2) {
      setError('Choisis un pseudo d’au moins 2 caractères.')
      return
    }
    if (containsBannedWord(name) || (aboutLine.trim() && containsBannedWord(aboutLine))) {
      setError(MODERATION_REFUSED_MESSAGE_FR)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await cloud.completeOauthProfile(name, aboutLine)
      queueMicrotask(() => {
        if (!preferencesComplete) openOnboarding()
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible. Réessaie.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-profile-title"
    >
      <div className="max-h-[min(92dvh,640px)] w-full max-w-md overflow-hidden rounded-[28px] border border-tf-grey-pastel/60 bg-tf-white text-tf-dark shadow-[0_24px_80px_rgba(1,30,51,0.22)]">
        <div className="border-b border-tf-grey-pastel/50 bg-tf-ice/90 px-5 py-4">
          <div className="flex items-start gap-3">
            <LogoMark variant="compact" className="!h-8" decorative={false} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black tracking-[0.2em] text-tf-grey">NOUVEAU COMPTE</div>
              <h2
                id="oauth-profile-title"
                className="mt-1 font-display text-xl font-black tracking-tight text-tf-dark sm:text-2xl"
              >
                Complète ton profil
              </h2>
              <p className="mt-1 text-sm font-semibold text-tf-grey">
                Connexion {providerLabel} : choisis comment tu apparaîtras sur Talk Foot (pseudo + une ligne sur toi,
                optionnel). Ensuite, on te demandera ta ligue et tes clubs.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
          {user?.email ? (
            <div>
              <p className="text-[11px] font-bold text-tf-grey">Email (fourni par {providerLabel})</p>
              <p className="mt-0.5 text-sm font-semibold text-tf-dark/80">{user.email}</p>
            </div>
          ) : null}

          <div>
            <label htmlFor="oauth-pseudo" className="mb-1 block text-xs font-bold text-tf-grey">
              Pseudo affiché <span className="text-rose-600">*</span>
            </label>
            <Input
              id="oauth-pseudo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ton pseudo sur les salons et le live"
              autoComplete="username"
              className="w-full rounded-xl border-tf-grey-pastel/50"
              maxLength={40}
            />
          </div>

          <div>
            <label htmlFor="oauth-about" className="mb-1 block text-xs font-bold text-tf-grey">
              À propos de toi (optionnel)
            </label>
            <textarea
              id="oauth-about"
              value={aboutLine}
              onChange={(e) => setAboutLine(e.target.value.slice(0, 160))}
              placeholder="Ex. Supporter depuis toujours, tribune nord…"
              rows={3}
              className={cn(
                'w-full resize-none rounded-xl border border-tf-grey-pastel/50 bg-white px-3 py-2.5 text-sm font-medium text-tf-dark outline-none placeholder:text-tf-dark/40',
                'focus-visible:ring-2 focus-visible:ring-sky-500/40',
              )}
            />
            <p className="mt-1 text-[10px] font-semibold text-tf-grey">{aboutLine.length}/160</p>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <Button type="submit" variant="primary" className="w-full rounded-2xl py-3 font-black" disabled={busy}>
            {busy ? 'Enregistrement…' : 'Continuer'}
          </Button>
        </form>
      </div>
    </div>
  )
}
