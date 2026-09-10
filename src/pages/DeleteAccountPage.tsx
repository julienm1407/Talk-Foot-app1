import { Link } from 'react-router-dom'
import { LegalPageShell } from '../components/legal/LegalPageShell'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../contexts/LocaleContext'
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
  const t = useT()
  const section = 'mt-8 space-y-3'
  const h2 = 'font-display text-lg font-black'
  const p = 'text-sm font-medium leading-relaxed opacity-90'
  const ul = 'list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90'
  const requestMailto = legalContactMailto(
    'Demande de suppression de compte Talk Foot / Talk Foot account deletion request',
    [
      'Je demande la suppression de mon compte Talk Foot et des données associées. / I request deletion of my Talk Foot account and associated data.',
      '',
      `Adresse e-mail du compte / Account email: ${user?.email?.trim() || '(indique ton e-mail / enter your email)'}`,
      `Identifiant affiché / Display name: ${user?.displayName?.trim() || '(optionnel / optional)'}`,
      '',
      'Merci de confirmer la suppression sous 30 jours. / Please confirm deletion within 30 days.',
      '',
    ].join('\n'),
  )

  return (
    <LegalPageShell title={t('deleteAccount.title')} intro={`${t('deleteAccount.intro')} (${LEGAL_PUBLIC_SITE}).`}>
      <section className={section}>
        <h2 className={h2}>{t('deleteAccount.section1Title')}</h2>
        <p className={p}>{t('deleteAccount.section1Body')}</p>
        {user ? (
          <p className={p}>
            <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              {t('deleteAccount.openProfile')}
            </Link>
          </p>
        ) : (
          <p className={p}>
            <Link to="/login" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              {t('deleteAccount.login')}
            </Link>
            {' → '}
            <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              {t('deleteAccount.profile')}
            </Link>
            . {t('deleteAccount.loginThenProfile')}
          </p>
        )}
      </section>

      <section className={section}>
        <h2 className={h2}>{t('deleteAccount.section2Title')}</h2>
        <p className={p}>
          {t('deleteAccount.section2BodyBefore')}{' '}
          <a href={requestMailto} className="font-bold text-tf-cta underline-offset-2 hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          {t('deleteAccount.section2BodyAfter')}
        </p>
        <p className={p}>
          <a
            href={requestMailto}
            className="inline-flex min-h-tf-touch items-center justify-center rounded-xl border-2 border-rose-600 bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-500"
          >
            {t('deleteAccount.emailCta')}
          </a>
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>{t('deleteAccount.section3Title')}</h2>
        <ul className={ul}>
          <li>Profil / Profile (pseudo, photo, préférences, avatar)</li>
          <li>État cloud / Cloud state (jetons, paris simulés, abonnement)</li>
          <li>Liens sociaux Talk Foot / Social links (amis, tribunes)</li>
          <li>Données locales / Local device data</li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>{t('deleteAccount.section4Title')}</h2>
        <p className={p}>
          <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            {t('deleteAccount.privacyLink')}
          </Link>
        </p>
      </section>
    </LegalPageShell>
  )
}
