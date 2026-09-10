import { Link } from 'react-router-dom'
import { LegalPageShell } from '../components/legal/LegalPageShell'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_PUBLISHER_NAME,
  LEGAL_PUBLIC_SITE,
  legalContactMailto,
} from '../constants/siteLegal'

/**
 * Normes publiques contre l’exploitation et les abus sexuels sur mineurs (CSAE).
 * URL à déclarer dans Google Play : https://talk-foot.com/child-safety
 */
export function ChildSafetyPage() {
  const section = 'mt-8 space-y-3'
  const h2 = 'font-display text-lg font-black'
  const p = 'text-sm font-medium leading-relaxed opacity-90'
  const ul = 'list-inside list-disc space-y-2 text-sm font-medium leading-relaxed opacity-90'

  return (
    <LegalPageShell
      title="Normes de sécurité des enfants (CSAE)"
      intro={`${LEGAL_PUBLISHER_NAME} (${LEGAL_PUBLIC_SITE}) publie ici ses normes contre l’exploitation et les abus sexuels sur mineurs (Child Sexual Abuse and Exploitation — CSAE), y compris les contenus CSAM.`}
    >
      <section className={section}>
        <h2 className={h2}>1. Champ d’application</h2>
        <p className={p}>
          Ces normes s’appliquent à l’application et au site <strong>Talk Foot</strong> : chats, tribunes live,
          groupes, débats, messages privés, profils et tout contenu généré par les utilisateurs.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>2. Interdiction absolue (CSAE / CSAM)</h2>
        <p className={p}>
          Talk Foot interdit strictement tout contenu, comportement ou échange visant à l’exploitation sexuelle
          d’enfants, aux abus sexuels sur mineurs, au grooming, au chantage sexuel (sextortion), à la traite, ou à
          la diffusion de matériel d’abus sexuel sur mineurs (CSAM — Child Sexual Abuse Material).
        </p>
        <ul className={ul}>
          <li>Création, partage, sollicitation ou conservation de tels contenus : interdits.</li>
          <li>Tout manquement entraîne suppression du contenu, suspension ou ban du compte, et signalement aux autorités compétentes lorsque la loi l’exige.</li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>3. Âge et public</h2>
        <p className={p}>
          Talk Foot est un réseau social football destiné à un public adulte / adolescent selon la fiche store. Les
          contenus à caractère sexuel impliquant des mineurs sont toujours interdits, sans exception.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>4. Signalement et mesures</h2>
        <ul className={ul}>
          <li>
            Signale un abus depuis la section Modération du{' '}
            <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              profil
            </Link>{' '}
            ou par e-mail à{' '}
            <a
              href={legalContactMailto('Signalement CSAE / sécurité enfants — Talk Foot')}
              className="font-bold text-tf-cta underline-offset-2 hover:underline"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </li>
          <li>
            Dès connaissance effective d’un contenu CSAM ou CSAE, Talk Foot agit pour le retirer, bloquer le compte
            concerné et, le cas échéant, transmettre un signalement aux autorités compétentes (ex. NCMEC ou
            équivalent régional / national).
          </li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>5. Point de contact sécurité enfants</h2>
        <p className={p}>
          Contact désigné pour les notifications liées à la CSAE (y compris Google Play) :{' '}
          <a
            href={legalContactMailto('Contact sécurité enfants CSAE — Talk Foot')}
            className="font-bold text-tf-cta underline-offset-2 hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Ce contact peut répondre aux procédures de modération et prendre des mesures.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>6. Documents liés</h2>
        <p className={p}>
          Voir aussi les{' '}
          <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            conditions d’utilisation
          </Link>{' '}
          et la{' '}
          <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
