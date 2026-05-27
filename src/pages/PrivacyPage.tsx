import { Link } from 'react-router-dom'
import { LegalPageShell } from '../components/legal/LegalPageShell'
import { LEGAL_PUBLISHER_NAME, LEGAL_PUBLIC_SITE } from '../constants/siteLegal'

export function PrivacyPage() {
  const section = 'mt-8 space-y-3'
  const h2 = 'font-display text-lg font-black'
  const p = 'text-sm font-medium leading-relaxed opacity-90'
  const ul = 'list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90'

  return (
    <LegalPageShell
      title="Confidentialité & données personnelles"
      intro={`${LEGAL_PUBLISHER_NAME} (${LEGAL_PUBLIC_SITE}) explique comment tes données sont traitées lorsque tu utilises le site et l'application.`}
    >
      <section className={section}>
        <h2 className={h2}>1. Responsable du traitement</h2>
        <p className={p}>
          Le service Talk Foot est édité sous le nom {LEGAL_PUBLISHER_NAME}. Pour exercer tes droits ou poser une
          question relative aux données personnelles, utilise l&apos;adresse de contact indiquée en bas de page.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>2. Données collectées</h2>
        <ul className={ul}>
          <li>
            <strong>Compte</strong> : identifiant, email, pseudo, photo de profil (selon mode de connexion : Clerk,
            Supabase ou stockage local sur l&apos;appareil).
          </li>
          <li>
            <strong>Activité</strong> : préférences supporter, messages dans les tribunes (lorsque synchronisés),
            participation aux groupes et débats, paris simulés à jetons, paramètres d&apos;affichage.
          </li>
          <li>
            <strong>Technique</strong> : journaux serveur habituels (adresse IP, type de navigateur) pour la sécurité
            et le fonctionnement du site.
          </li>
          <li>
            <strong>Données sportives</strong> : requêtes vers des API tierces (ex. SportMonks) sans transmission de ton
            identité personnelle lorsque cela est évitable.
          </li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>3. Finalités</h2>
        <ul className={ul}>
          <li>Fournir les fonctionnalités du service (compte, chat, groupes, live).</li>
          <li>Modérer les contenus publiés par les utilisateurs.</li>
          <li>Mesurer l&apos;audience et afficher des publicités sur les pages éditoriales autorisées.</li>
          <li>Améliorer la stabilité et la sécurité du site.</li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>4. Base légale (RGPD)</h2>
        <p className={p}>
          Exécution du contrat / conditions d&apos;utilisation pour le cœur du service ; intérêt légitime pour la
          sécurité et la modération ; consentement lorsque requis (cookies publicitaires non essentiels en Union
          européenne).
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>5. Hébergement & sous-traitants</h2>
        <p className={p}>
          Les données peuvent être traitées par des prestataires techniques (hébergement web, base de données
          Supabase, authentification Clerk, Google pour la publicité AdSense le cas échéant). Leurs politiques
          s&apos;appliquent en complément.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>6. Durée de conservation</h2>
        <p className={p}>
          Tant que ton compte est actif, puis suppression ou anonymisation selon les besoins légitimes. Tu peux
          exporter ou supprimer les données stockées localement depuis la page Profil. Pour les données côté serveur,
          contacte-nous.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>7. Tes droits</h2>
        <p className={p}>
          Accès, rectification, effacement, limitation, opposition et portabilité lorsque applicable. Réclamation
          possible auprès de la CNIL ou de l&apos;autorité de ton pays.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>8. Cookies & traceurs</h2>
        <p className={p}>
          <strong>Nécessaires au fonctionnement</strong> : stockage local (compte, préférences), sessions
          d&apos;authentification.
        </p>
        <p className={p}>
          <strong>Publicité Google AdSense</strong> : sur l&apos;accueil et certaines pages éditoriales (articles,
          fiches débat/club), Google peut déposer des cookies pour diffuser et mesurer des annonces, personnaliser
          celles-ci selon ta navigation. Tu peux gérer les préférences via{' '}
          <a
            href="https://adssettings.google.com"
            className="font-bold text-tf-cta underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            les paramètres Google Ads
          </a>{' '}
          ou la page{' '}
          <a
            href="https://policies.google.com/technologies/ads"
            className="font-bold text-tf-cta underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            technologies publicitaires Google
          </a>
          . Les tribunes live et chats de groupe n&apos;affichent pas de script publicitaire.
        </p>
        <p className={p}>
          Un bandeau t&apos;informe lors de ta première visite ; tu peux refuser les traceurs non essentiels en ne
          poursuivant pas l&apos;utilisation du site.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>9. Modération des contenus</h2>
        <p className={p}>
          Les messages peuvent être filtrés automatiquement (insultes, liens). En cas de blocage, le contenu n&apos;est
          pas publié. Signalement possible depuis le profil ou par email.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>10. Sécurité</h2>
        <p className={p}>
          Connexion HTTPS, accès restreint aux bases de données, bonnes pratiques d&apos;authentification. Aucun système
          n&apos;est invulnérable : utilise un mot de passe robuste et un appareil de confiance.
        </p>
      </section>

      <p className="mt-6 text-sm font-medium opacity-90">
        Voir aussi les{' '}
        <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
          conditions d&apos;utilisation
        </Link>{' '}
        et la page{' '}
        <Link to="/about" className="font-bold text-tf-cta underline-offset-2 hover:underline">
          À propos
        </Link>
        .
      </p>
    </LegalPageShell>
  )
}
