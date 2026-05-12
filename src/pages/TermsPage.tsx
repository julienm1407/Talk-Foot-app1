import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAppearance } from '../contexts/AppearanceContext'
import { cn } from '../utils/cn'
import { LogoMark } from '../layout/LogoMark'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'

/**
 * Conditions d'utilisation Talk Foot (version informationnelle).
 * A faire valider / adapter par un juriste avant un usage production sensible.
 */
export function TermsPage() {
  const { user } = useAuth()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <div className="relative min-h-dvh">
      <div className="tf-page-backdrop" aria-hidden />
      <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
        <ThemeAppearanceToggle variant="floating" className="shadow-sm" />
      </div>
      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
          {user ? (
            <Link to="/" className="text-tf-cta hover:underline">
              ← Accueil
            </Link>
          ) : null}
          <Link to="/login" className="text-tf-cta hover:underline">
            {user ? 'Connexion (autre compte)' : '← Connexion'}
          </Link>
        </div>
        <div className="mb-6 flex justify-center">
          <LogoMark variant="hero" className="max-w-[180px]" decorative />
        </div>
        <article
          className={cn(
            'rounded-3xl border p-6 shadow-sm sm:p-8',
            L ? 'border-tf-dark/10 bg-white/95 text-tf-dark' : 'border-white/15 bg-tf-dark/90 text-slate-100',
          )}
        >
          <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
            Conditions d&apos;utilisation
          </h1>
          <p className="mt-2 text-sm font-medium opacity-80">
            Derniere mise a jour : application Talk Foot (version locale / demo). Ce texte est informatif et ne
            remplace pas un avis juridique.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">1. Objet du service</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Talk Foot propose des contenus, discussions et fonctionnalites communautaires autour du football
              (actualites, debats, groupes, simulations). Le service peut evoluer a tout moment.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">2. Creation de compte</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Tu es responsable des informations de ton compte et de l&apos;usage qui en est fait. Tu dois fournir des
              informations exactes et ne pas usurper l&apos;identite d&apos;un tiers.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">3. Regles de conduite</h2>
            <ul className="list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90">
              <li>Respect des autres utilisateurs : pas d&apos;insultes, harcelement, haine ou discrimination.</li>
              <li>Pas de contenus illicites, trompeurs, diffamatoires ou portant atteinte aux droits de tiers.</li>
              <li>Pas de spam, tentative de fraude, extraction abusive ou perturbation technique du service.</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">4. Contenus utilisateurs</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Tu restes responsable des messages, pseudos, images et contenus que tu publies. Talk Foot peut moderer,
              masquer ou supprimer un contenu qui ne respecte pas ces conditions.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">5. Disponibilite et limitations</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Le service est fourni &quot;en l&apos;etat&quot;, sans garantie de disponibilite continue ni d&apos;absence
              d&apos;erreur. Les donnees sportives et contenus tiers peuvent comporter des delais ou inexactitudes.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">6. Propriete intellectuelle</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Les elements visuels, techniques et editoriaux de Talk Foot restent proteges. Toute reutilisation
              substantielle sans autorisation est interdite.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">7. Donnees personnelles</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Le traitement des donnees personnelles est detaille dans la{' '}
              <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                politique de confidentialite
              </Link>
              .
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">8. Suspension / suppression de compte</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              En cas de non-respect des regles, Talk Foot peut restreindre temporairement ou supprimer l&apos;acces au
              service, avec ou sans avertissement selon la gravite.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">9. Contact</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Contact editeur / support : a renseigner avant mise en production publique (email ou formulaire legal).
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
