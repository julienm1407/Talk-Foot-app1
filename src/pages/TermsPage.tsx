import { Link } from 'react-router-dom'
import { LegalPageShell } from '../components/legal/LegalPageShell'
import { LEGAL_CONTACT_EMAIL, LEGAL_PUBLISHER_NAME, legalContactMailto } from '../constants/siteLegal'

export function TermsPage() {
  const section = 'mt-8 space-y-3'
  const h2 = 'font-display text-lg font-black'
  const p = 'text-sm font-medium leading-relaxed opacity-90'
  const ul = 'list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90'

  return (
    <LegalPageShell
      title="Conditions d'utilisation"
      intro={`En utilisant ${LEGAL_PUBLISHER_NAME}, tu acceptes les règles ci-dessous.`}
    >
      <section className={section}>
        <h2 className={h2}>1. Objet</h2>
        <p className={p}>
          Talk Foot propose des contenus et fonctionnalités communautaires autour du football : actualités,
          débats, groupes, tribunes live, pronostics à jetons fictifs. Le service peut évoluer.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>2. Compte utilisateur</h2>
        <p className={p}>
          Tu es responsable de ton compte et de l&apos;exactitude des informations fournies. Le pseudo est unique et
          peut être modifié dans la limite de 2 changements par période de 14 jours (voir Profil).
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>3. Paris & jetons</h2>
        <p className={p}>
          Les paris, jetons, médailles et récompenses sont une <strong>simulation de jeu</strong> sans valeur
          monétaire réelle. Aucun dépôt, retrait ou gain financier n&apos;est possible. Talk Foot n&apos;est pas un
          site de paris sportifs agréé.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>4. Règles de conduite</h2>
        <ul className={ul}>
          <li>Respect des autres : pas d&apos;insultes, harcèlement, haine ou discrimination.</li>
          <li>Pas de contenus illicites, trompeurs ou portant atteinte aux droits de tiers.</li>
          <li>Pas de spam ni de perturbation technique du service.</li>
        </ul>
      </section>

      <section id="ugc" className={`${section} scroll-mt-6`}>
        <h2 className={h2}>5. Contenus utilisateurs (UGC)</h2>
        <p className={p}>
          Tu restes responsable des messages, pseudos, titres de débats et contenus publiés (tribunes live, groupes,
          messages privés, débats).
        </p>
        <ul className={ul}>
          <li>
            <strong>Filtre automatique</strong> : insultes et propos haineux bloqués côté application et serveur.
          </li>
          <li>
            <strong>Pas de liens</strong> dans les chats (URLs et domaines interdits).
          </li>
          <li>
            <strong>Signalement</strong> : depuis la section Modération du{' '}
            <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              profil
            </Link>{' '}
            ou par email à{' '}
            <a
              href={legalContactMailto('Signalement abus Talk Foot')}
              className="font-bold text-tf-cta underline-offset-2 hover:underline"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </li>
          <li>Talk Foot peut supprimer un contenu ou suspendre un compte en cas de manquement.</li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>6. Contenus éditoriaux & publicité</h2>
        <p className={p}>
          Les articles et textes d&apos;accueil sont fournis par l&apos;éditeur. Des annonces Google AdSense peuvent
          s&apos;afficher sur l&apos;accueil et certaines pages éditoriales ; les pages de chat live et de connexion
          n&apos;en comportent pas.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>7. Propriété intellectuelle</h2>
        <p className={p}>
          Les éléments de Talk Foot (marque, interface, textes éditoriaux) sont protégés. Les données sportives et
          logos de clubs peuvent appartenir à des tiers.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>8. Données personnelles</h2>
        <p className={p}>
          Voir la{' '}
          <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>9. Limitation de responsabilité</h2>
        <p className={p}>
          Service fourni « en l&apos;état ». Les scores et données sportives peuvent être retardés ou inexacts.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>10. Suspension</h2>
        <p className={p}>
          En cas de non-respect des présentes conditions, l&apos;accès peut être restreint ou supprimé.
        </p>
      </section>
    </LegalPageShell>
  )
}
