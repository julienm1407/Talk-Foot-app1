import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel } from '../../utils/hubSurface'
import { EditorialProse } from './EditorialProse'

/** Texte éditorial visible sur l’accueil (contenu d’éditeur pour AdSense / SEO). */
export function HomeEditorialIntro() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <EditorialProse
      title="Talk Foot, le hub des supporters"
      light={L}
      className={hubGlassPanel(appearance)}
      paragraphs={[
        'Talk Foot regroupe les matchs en direct, les salons de discussion par tribune, les débats entre supporters et des analyses sur les championnats majeurs (Ligue 1, Premier League, Liga, Serie A, Bundesliga).',
        'Chaque rencontre dispose d’un fil de messages en temps réel, de compositions, de statistiques et d’espaces dédiés aux groupes. Les articles du site complètent l’expérience avec du contexte tactique et des liens vers les fonctionnalités communautaires.',
        'Les pages utilitaires (connexion, paramètres, salons live plein écran) restent sans publicité afin de préserver une navigation fluide ; les annonces n’apparaissent que sur cette page d’accueil et sur les contenus éditoriaux (articles, fiches débat, hubs clubs).',
      ]}
    />
  )
}
