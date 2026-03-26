export type NewsItem = {
  id: string
  title: string
  excerpt: string
  tag: 'Breaking' | 'Analyse' | 'Rumeurs' | 'Débrief'
  minutesAgo: number
  /** Ligues concernées (ids type competitionThemes). Vide = général */
  leagueIds?: string[]
  /** Clubs mentionnés (optionnel, pour filtre fin) */
  clubIds?: string[]
  /** URL publique /article/:slug — absent pour les actus générées (ex. synthétiques) */
  slug?: string
  /** Date de publication (ISO) — SEO & balise <time> */
  publishedAt?: string
  /** Paragraphes du corps — page article si présent avec slug */
  body?: string[]
}

// Images football Unsplash — licence Unsplash (usage libre) https://unsplash.com/license
const FOOTBALL_IMAGES = [
  '1574629810360-7efbbe195018', // Stade, vue terrain
  '1579952363873-27f3bade9f55', // Ballon sur la pelouse
  '1522778119026-d647482059dc', // Match, ambiance
  '1715270525118-ce589797568b', // Joueur en action
  '1508098682722-e3c9e7a2e26a', // Stade aérien
]

/** Image « une » page article (même lot Unsplash License — vue stade / terrain). */
const ARTICLE_LEAD_FREE_PHOTO = '1574629810360-7efbbe195018'

function imageIndex(articleId: string): number {
  return articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % FOOTBALL_IMAGES.length
}

export type NewsImageVariant = 'feed' | 'hero' | 'og' | 'articleLead'

const IMAGE_PARAMS: Record<NewsImageVariant, string> = {
  feed: 'w=720&h=400&fit=crop&q=80',
  hero: 'w=1600&h=720&fit=crop&q=85',
  og: 'w=1200&h=630&fit=crop&q=85',
  /** Colonne ~30 % : format un peu portrait, lisible à côté du live */
  articleLead: 'w=560&h=720&fit=crop&crop=entropy&q=85',
}

export function footballImageUrl(articleId: string, variant: NewsImageVariant = 'feed'): string {
  const photoId = variant === 'articleLead' ? ARTICLE_LEAD_FREE_PHOTO : FOOTBALL_IMAGES[imageIndex(articleId)]
  return `https://images.unsplash.com/photo-${photoId}?${IMAGE_PARAMS[variant]}&auto=format`
}

export function getArticleBySlug(
  slug: string,
): (NewsItem & { slug: string; body: string[] }) | undefined {
  const n = mockNews.find((x) => x.slug === slug)
  if (n?.slug && n.body && n.body.length > 0) {
    return n as NewsItem & { slug: string; body: string[] }
  }
  return undefined
}

/** Actu éligible à une page /article/:slug */
export function newsItemHasArticlePage(n: NewsItem): n is NewsItem & { slug: string; body: string[] } {
  return Boolean(n.slug && n.body && n.body.length > 0)
}

export const mockNews: NewsItem[] = [
  {
    id: 'n-1',
    slug: 'ligue-1-tension-choc-week-end',
    publishedAt: '2025-03-26T09:00:00+01:00',
    tag: 'Breaking',
    minutesAgo: 7,
    title: 'Ligue 1 : tension avant le choc du week-end',
    excerpt:
      'Les groupes de supporters Talk Foot saturent avant le derby. Ambiance électrique côté tribunes virtuelles.',
    leagueIds: ['ligue-1'],
    clubIds: ['psg', 'om'],
    body: [
      'À quelques heures du coup d’envoi, les salons et groupes dédiés au choc tournent déjà à plein régime. Sur Talk Foot, ce n’est pas seulement un fil de commentaires : c’est une tribune continue, avec des réactions instantanées et des débats qui suivent le rythme du match.',
      'Les supporters structurent leurs échanges autour d’indices live, de moments clés et de « vibes » partagées — proche de ce que tu ressens au stade, mais accessible depuis ton canapé ou ton trajet.',
      'Côté Ligue 1, la semaine a été riche en polémiques arbitrales et en annonces côté effectif : autant de sujets qui alimentent les fils avant même que les équipes sortent du tunnel.',
      'Si tu découvres l’app, c’est le bon moment pour entrer dans un salon live : tu verras comment la communauté capte l’énergie du match, entre humour, analyses rapides et pics entre tribunes.',
    ],
  },
  {
    id: 'n-2',
    slug: 'premier-league-pressing-haut-analyse',
    publishedAt: '2025-03-25T18:30:00+01:00',
    tag: 'Analyse',
    minutesAgo: 22,
    title: 'Premier League : le pressing haut qui change tout',
    excerpt:
      'Deux séquences clés en EPL montrent comment récupérer haut. Focus tactique pour les kop connectés.',
    leagueIds: ['epl'],
    body: [
      'Le pressing haut n’est plus réservé aux gros budgets : en Premier League, plusieurs équipes l’ont industrialisé. L’idée est simple — gêner la relance, forcer le long, récupérer dans la moitié adverse — mais l’exécution demande synchronisation et courage.',
      'Dans les salons Talk Foot, les fans décortiquent ces phases image par image : qui ferme l’intérieur, qui couvre la profondeur, et comment le gardien participe au jeu court. C’est de la tactique de vestiaire, version conversation fluide.',
      'Les séquences qui marquent le plus sont souvent celles où une équipe en infériorité numérique apparente « mord » quand même : le live devient un cours accéléré, avec des avis tranchés et des stats qui passent en encart.',
      'Pour vraiment ressentir le rythme, rien ne vaut un match en direct dans l’app : le chat accélère quand la pression monte, et les réactions collent au tempo des transitions.',
    ],
  },
  {
    id: 'n-3',
    slug: 'mercato-serie-a-milieu-prioritaire',
    publishedAt: '2025-03-25T14:00:00+01:00',
    tag: 'Rumeurs',
    minutesAgo: 48,
    title: 'Mercato : la Serie A sur un milieu prioritaire',
    excerpt:
      'Plusieurs clubs italiens suivent la même piste. Rien d’officiel, mais les rumeurs circulent sur les salons.',
    leagueIds: ['serie-a'],
    body: [
      'Les fenêtres de mercato modernes se jouent autant dans les médias que dans les groupes privés. En Serie A, plusieurs directions sportives auraient ciblé le même profil de milieu relayeur — assez pour enflammer les débats entre tifosi.',
      'Sur Talk Foot, les rumeurs sont taguées, relativisées et confrontées aux sources : l’objectif n’est pas de fabriquer du scoop, mais de partager une veille collective avec de l’ironie et du recul.',
      'Quand une piste se confirme ou s’effondre, c’est souvent en plein live que la nouvelle prend toute sa saveur : les réactions s’enchaînent et les pronostics sur les compositions bougent en temps réel.',
      'Tu suis le mercato tout en regardant un match ? L’app relie les deux mondes : même communauté, même énergie, du coup d’envoi au dernier jour du marché.',
    ],
  },
  {
    id: 'n-4',
    slug: 'laliga-debrief-actions-live',
    publishedAt: '2025-03-25T11:15:00+01:00',
    tag: 'Débrief',
    minutesAgo: 75,
    title: 'LaLiga : trois actions qui ont fait vibrer le live',
    excerpt:
      'Arrêt décisif, contre rapide et VAR : retour sur une soirée intense pour les supporters connectés.',
    leagueIds: ['laliga'],
    body: [
      'Certaines soirées résument tout ce qu’on aime du foot : un arrêt spectaculaire, une contre-attaque filante, une séquence VAR qui divise les tribunes. Hier en LaLiga, les trois se sont enchaînés.',
      'Côté Talk Foot, le live a suivi cette montée en tension : pics d’activité à chaque ralenti, mèmes ciblés sur le gardien, threads tactiques sur le déclenchement du contre.',
      'Le débrief collectif remplace parfois le plateau TV : des angles différents, des langues mélangées, et une sensation d’être « dans le match » plutôt que de le subir.',
      'Si tu as raté le direct, tu peux quand même rejoindre l’ambiance sur les prochains matchs : chaque rencontre rouvre un salon avec sa propre personnalité.',
    ],
  },
  {
    id: 'n-5',
    slug: 'bundesliga-intensite-transitions-live',
    publishedAt: '2025-03-25T09:45:00+01:00',
    tag: 'Analyse',
    minutesAgo: 90,
    title: 'Bundesliga : intensité et transitions',
    excerpt:
      'Pourquoi le championnat allemand reste une référence pour les stats live et les réactions en tribune.',
    leagueIds: ['bund'],
    body: [
      'La Bundesliga continue d’afficher un rythme d’actions hautes et des transitions fulgurantes. Pour les amateurs de data et de sensations fortes, c’est un laboratoire : chaque récupération peut basculer le match en quelques secondes.',
      'Dans l’app, cette verticalité se traduit par des vagues de messages quand les lignes se décalent : les supporters parlent pressing, lignes de passe et espaces comme sur un tableau tactique improvisé.',
      'L’immersion vient aussi du son et du rythme visuel des encarts live — score, temps fort, momentum — pensés pour que tu captes l’essentiel sans quitter la conversation.',
      'Tu veux voir comment ça rend en situation réelle ? Lance un live Bundesliga ou un autre grand match : tu comprendras vite pourquoi les tribunes virtuelles collent si bien à ce championnat.',
    ],
  },
  {
    id: 'n-global',
    slug: 'talk-foot-nouveautes-experience-supporter',
    publishedAt: '2025-03-26T08:00:00+01:00',
    tag: 'Breaking',
    minutesAgo: 5,
    title: 'Talk Foot : nouveautés pour ton expérience supporter',
    excerpt:
      'Personnalise ton club et ta ligue, filtre les salons et active le mode Virage pour un live 100 % tribune.',
    body: [
      'Talk Foot évolue autour d’une idée simple : rapprocher les fans du ressenti d’un match au stade. Personnalisation des clubs et des ligues, filtrage des salons, mode Virage pour une immersion type kop : tout est pensé pour que tu te sentes à ta place.',
      'Le live match reste le cœur du produit : un canal par rencontre, des réactions qui s’empilent comme les chants en tribune, et des fonctionnalités qui mettent en avant l’ambiance plus que le bruit.',
      'Pour aller plus loin, l’expérience stade virtuel te propose une autre lecture du même événement — plus visuelle, plus collective — sans sacrifier le fil d’actualité et les échanges entre supporters.',
      'Enfin, les paris « entre nous » et les classements ajoutent une couche compétitive légère : assez pour pimenter le live, sans voler la vedette au jeu sur le terrain.',
      'Tu es nouveau ? Choisis un match en cours, entre dans le salon, et laisse la tribune faire le reste.',
    ],
  },
]
