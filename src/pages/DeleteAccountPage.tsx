import { Link } from 'react-router-dom'
import { LegalPageShell } from '../components/legal/LegalPageShell'
import { useAuth } from '../contexts/AuthContext'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_PUBLIC_SITE,
  legalContactMailto,
} from '../constants/siteLegal'

/**
 * Page publique exigée par Google Play (URL de suppression de compte).
 * URL à déclarer : https://talk-foot.com/delete-account
 */
export function DeleteAccountPage() {
  const { user } = useAuth()
  const section = 'mt-8 space-y-3'
  const h2 = 'font-display text-lg font-black'
  const p = 'text-sm font-medium leading-relaxed opacity-90'
  const ul = 'list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90'
  const requestMailto = legalContactMailto(
    'Demande de suppression de compte Talk Foot',
    [
      'Je demande la suppression de mon compte Talk Foot et des données associées.',
      '',
      `Adresse e-mail du compte : ${user?.email?.trim() || '(indique ton e-mail de connexion)'}`,
      `Identifiant affiché : ${user?.displayName?.trim() || '(optionnel)'}`,
      '',
      'Merci de confirmer la suppression sous 30 jours.',
      '',
    ].join('\n'),
  )

  return (
    <LegalPageShell
      title="Supprimer mon compte"
      intro={`Page publique pour demander ou effectuer la suppression de ton compte Talk Foot et des données associées (${LEGAL_PUBLIC_SITE}).`}
    >
      <section className={section}>
        <h2 className={h2}>1. Suppression immédiate dans l&apos;app</h2>
        <p className={p}>
          Si tu es connecté, tu peux supprimer ton compte et tes données Talk Foot directement depuis ton profil
          (section « Données personnelles ») : export JSON optionnel, puis suppression irréversible du compte cloud
          et des données locales.
        </p>
        {user ? (
          <p className={p}>
            <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              Ouvrir mon profil → Supprimer mon compte
            </Link>
          </p>
        ) : (
          <p className={p}>
            <Link to="/login" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              Se connecter
            </Link>
            {' '}
            puis aller dans{' '}
            <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              Profil
            </Link>
            {' '}
            pour supprimer le compte.
          </p>
        )}
      </section>

      <section className={section}>
        <h2 className={h2}>2. Demande par e-mail</h2>
        <p className={p}>
          Tu peux aussi demander la suppression sans passer par l&apos;app. Envoie un message à{' '}
          <a href={requestMailto} className="font-bold text-tf-cta underline-offset-2 hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{' '}
          avec l&apos;e-mail du compte à supprimer. Nous traitons la demande sous{' '}
          <strong>30 jours</strong> maximum.
        </p>
        <p className={p}>
          <a
            href={requestMailto}
            className="inline-flex min-h-tf-touch items-center justify-center rounded-xl border-2 border-rose-600 bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-500"
          >
            Demander la suppression par e-mail
          </a>
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>3. Données concernées</h2>
        <ul className={ul}>
          <li>Profil (pseudo, photo, préférences supporter, avatar)</li>
          <li>État cloud associé au compte (jetons, paris simulés, abonnement stocké côté Talk Foot)</li>
          <li>Liens sociaux Talk Foot (amis, adhésions aux tribunes) lorsque liés à ton compte</li>
          <li>Données locales sur l&apos;appareil (stockage navigateur / app)</li>
        </ul>
        <p className={p}>
          Certains journaux techniques ou obligations légales peuvent être conservés de façon limitée. Les messages
          déjà publiés dans une tribune peuvent être anonymisés plutôt que retirés du fil public, selon le contexte.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>4. Confidentialité</h2>
        <p className={p}>
          Plus de détails dans la{' '}
          <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
