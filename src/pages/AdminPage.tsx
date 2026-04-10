import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../utils/cn'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

/**
 * Espace réservé : uniquement si `user.isAdmin` (email ∈ VITE_ADMIN_EMAILS).
 * Tu peux y brancher un mini-CRM, des stats, etc.
 */
export function AdminPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <header className="space-y-1 border-b border-tf-grey-pastel/50 pb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Accès restreint</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">Administration</h1>
        <p className="text-sm font-medium text-tf-grey">
          Connecté en tant que <strong className="text-tf-dark">{user?.email ?? user?.displayName}</strong>
        </p>
      </header>

      <div
        className={cn(
          'rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm font-semibold text-amber-950',
        )}
      >
        Cette zone n’est visible que pour les comptes dont l’email est listé dans{' '}
        <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">VITE_ADMIN_EMAILS</code> (fichier{' '}
        <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">.env</code>), puis rebuild du site.
      </div>

      <section className="rounded-2xl border border-tf-grey-pastel/60 bg-tf-white/80 p-5 shadow-sm">
        <h2 className="font-display text-lg font-black text-tf-dark">Tableau de bord</h2>
        <p className="mt-2 text-sm font-medium text-tf-grey">
          Emplacement pour tes outils (CRM, modération, métriques…).
        </p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-tf-dark/85">
          <li>Clients / tickets (API à brancher)</li>
          <li>Raccourcis internes</li>
        </ul>
      </section>

      <Link
        to="/profile"
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex min-h-tf-touch items-center justify-center rounded-xl border border-tf-dark bg-white/95 px-5 py-3 text-sm font-semibold font-display text-tf-dark shadow-tf-elev-1 transition hover:bg-tf-electric-soft',
        )}
      >
        Retour au profil
      </Link>
    </div>
  )
}
