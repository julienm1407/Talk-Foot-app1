import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

/** Retour OAuth Google (Clerk) après redirection navigateur. */
export function LoginSsoCallbackPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center">
      <div className="tf-page-backdrop" aria-hidden />
      <p className="relative text-sm font-semibold text-tf-grey">Connexion Google…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
