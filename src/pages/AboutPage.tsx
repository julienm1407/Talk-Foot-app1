import { Link } from 'react-router-dom'
import { useAppearance } from '../contexts/AppearanceContext'
import { LegalPageShell } from '../components/legal/LegalPageShell'
import { LEGAL_PUBLIC_SITE } from '../constants/siteLegal'
import { cn } from '../utils/cn'

export function AboutPage() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const section = 'mt-8 space-y-3'
  const h2 = 'font-display text-lg font-black'
  const p = 'text-sm font-medium leading-relaxed opacity-90'

  return (
    <LegalPageShell
      title="À propos de Talk Foot"
      intro={`Talk Foot est un réseau social autour du football, accessible sur ${LEGAL_PUBLIC_SITE}. Cette page présente l'éditeur et le fonctionnement du service.`}
    >
      <section className={section}>
        <h2 className={h2}>Notre mission</h2>
        <p className={p}>
          Rassembler les supporters autour des matchs en direct : salons de discussion, débats, groupes, tribunes
          virtuelles et contenus éditoriaux sur les grands championnats européens.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Contenu éditorial</h2>
        <p className={p}>
          L&apos;accueil et les articles publiés sur Talk Foot proposent du contexte football (analyses, liens vers les
          fonctionnalités communautaires). Les contenus sont rédigés ou validés pour l&apos;application ; les messages
          des utilisateurs dans les chats sont distincts et modérés automatiquement.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Communauté & modération</h2>
        <p className={p}>
          Les utilisateurs peuvent publier des messages dans les salons live, les groupes et les messages privés. Un
          filtre bloque insultes, propos haineux et liens externes dans les chats. Tu peux signaler un abus depuis ton{' '}
          <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            profil
          </Link>{' '}
          ou par email. Les règles détaillées figurent dans les{' '}
          <Link to="/terms#ugc" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            conditions d&apos;utilisation
          </Link>
          .
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Paris & jetons (simulation)</h2>
        <p className={p}>
          Les pronostics entre supporters reposent sur des jetons virtuels sans valeur monétaire réelle. Il n&apos;y a
          ni dépôt d&apos;argent, ni gains financiers. Talk Foot n&apos;est pas un opérateur de jeux d&apos;argent.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Publicité</h2>
        <p className={p}>
          Des annonces Google AdSense peuvent apparaître sur l&apos;accueil et certaines pages éditoriales (articles,
          fiches débat ou club). Les salons de match, chats de groupe et pages de connexion restent sans publicité pour
          préserver l&apos;expérience utilisateur. Voir la{' '}
          <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            politique de confidentialité
          </Link>{' '}
          pour les cookies liés à la publicité.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Données sportives</h2>
        <p className={p}>
          Calendriers, scores et statistiques proviennent de fournisseurs tiers (ex. SportMonks). Ils peuvent comporter
          des retards ou des erreurs ; Talk Foot ne garantit pas leur exactitude en temps réel.
        </p>
      </section>

      <p className={cn('mt-8 text-xs font-medium opacity-70', L ? 'text-tf-dark/70' : 'text-slate-300')}>
        Talk Foot · {LEGAL_PUBLIC_SITE}
      </p>
    </LegalPageShell>
  )
}
