import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAppearance } from '../contexts/AppearanceContext'
import { cn } from '../utils/cn'
import { LogoMark } from '../layout/LogoMark'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'

/**
 * Informations à destination des utilisateurs (transparence RGPD).
 * À faire valider / adapter par un juriste si l’app traite des données réelles en production.
 */
export function PrivacyPage() {
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
            Confidentialité & données personnelles
          </h1>
          <p className="mt-2 text-sm font-medium opacity-80">
            Dernière mise à jour : application Talk Foot (version locale / démo). Ce texte vise la transparence ; il ne
            remplace pas un avis juridique.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">1. Qui traite les données ?</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              L’application fonctionne pour l’essentiel dans ton navigateur. Les données que tu saisis (compte, profil,
              préférences, paris locaux, etc.) sont enregistrées sur ton appareil via le stockage local du navigateur
              (localStorage / sessionStorage), sauf mention contraire.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">2. Quelles données ?</h2>
            <ul className="list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90">
              <li>
                <strong>Compte</strong> : email et nom d&apos;affichage si tu crées un compte email ; une empreinte
                dérivée du mot de passe (pas le mot de passe en clair) est stockée localement.
              </li>
              <li>
                <strong>Activité dans l&apos;app</strong> : préférences supporter, avatar, historique de paris simulés,
                groupes, messages locaux, etc.
              </li>
              <li>
                <strong>API football</strong> : requêtes vers des fournisseurs tiers (ex. calendriers, résultats) —
                consulte leur politique de confidentialité ; l’app peut transmettre des données techniques habituelles
                (adresse IP côté réseau) sans les afficher dans l’interface.
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">3. Données réelles et simulations</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Talk Foot distingue clairement ce qui provient de services réels et ce qui relève du jeu ou de la démo :
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90">
              <li>
                <strong>Réel</strong> : articles publiés en base, messages de salons live et de groupes (Supabase),
                débats avec compteurs participants/messages agrégés, amis et messages privés synchronisés, effectifs
                adhérents aux groupes, statistiques de présence sur un salon live lorsque des messages existent.
              </li>
              <li>
                <strong>Données sportives</strong> : calendriers, scores, compositions et classements via SportMonks
                (selon ta clé API / configuration).
              </li>
              <li>
                <strong>Simulation / jeu</strong> : jetons et médailles de navigation, paris entre supporters (cotes
                internes, gains fictifs), boutique cosmétique, récompenses quotidiennes — sans enjeu financier réel.
              </li>
              <li>
                <strong>Absence de donnée</strong> : si aucun article ou débat n’est publié, l’interface affiche un
                état vide explicite plutôt que du contenu inventé.
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">4. Finalités & base légale</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Fournir les fonctionnalités que tu demandes (compte, personnalisation, jeu, boutique locale). Base
              légale : exécution d&apos;une relation d&apos;utilisation de l&apos;service et, le cas échéant, ton
              consentement pour les options qui le requièrent.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">5. Durée de conservation</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Tant que tu ne les supprimes pas (fonction « Supprimer mes données » dans le profil) ou que tu ne vides
              pas le stockage du navigateur. Aucun serveur Talk Foot n&apos;est impliqué pour ces données locales dans
              cette version démo.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">6. Tes droits (RGPD)</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Tu peux <strong>exporter</strong> une copie des données stockées localement et{' '}
              <strong>supprimer</strong> l&apos;ensemble des données Talk Foot sur cet appareil depuis la page Profil.
              Pour rectifier ton pseudo ou email (compte local), utilise les réglages du profil. Pour une réclamation,
              tu peux contacter l&apos;autorité de protection des données de ton pays.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">7. Cookies & traceurs</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Pas de cookies publicitaires tiers dans cette version. Un bandeau t&apos;informe du stockage local
              nécessaire au fonctionnement ; tu peux refuser en ne poursuivant pas l&apos;utilisation (certaines
              fonctions seront indisponibles).
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="font-display text-lg font-black">8. Sécurité</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Les mots de passe des comptes email sont hachés sur l&apos;appareil. Toute donnée locale peut être lue sur
              un poste compromis : utilise un appareil de confiance et, en production, privilégie une authentification
              serveur sécurisée (HTTPS, sessions, etc.).
            </p>
          </section>

          <p className="mt-10 text-xs font-medium opacity-70">
            Contact éditeur : à renseigner avant mise en production publique (email ou formulaire).
          </p>
          <p className="mt-3 text-xs font-medium opacity-70">
            Voir aussi les{' '}
            <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              conditions d&apos;utilisation
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  )
}
