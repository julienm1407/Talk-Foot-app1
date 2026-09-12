/**
 * Coach Talk Foot — réponses locales guidées (pas d’API LLM).
 * Liens cliquables : syntaxe `[libellé](/chemin)`.
 */

type BotReply = string

function link(label: string, href: string): string {
  return `[${label}](${href})`
}

export function pickTalkFootBotReply(userMessage: string): BotReply {
  const t = userMessage.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

  if (/\b(salut|bonjour|bonsoir|hey|coucou|yo|hello)\b|^ca va|comment (ca|tu) va/.test(t)) {
    return [
      'Salut ! Je suis **Coach Talk Foot**, ton guide dans l’app.',
      '',
      `• Live & cotes → ${link('Matchs', '/match')}`,
      `• Maillots & offres → ${link('Boutique', '/boutique')}`,
      `• Tribunes → ${link('Groupes', '/groups')}`,
      `• Ton espace → ${link('Profil', '/profile')}`,
      '',
      'Dis-moi ce que tu cherches (ex. « ouvrir les paris », « page PSG », « offre du jour »).',
    ].join('\n')
  }

  if (/boutique|maillot|short|medaille|médaille|offre du jour|pack|acheter|cosmetic/.test(t)) {
    return [
      'Boutique Talk Foot :',
      `• Catalogue maillots / shorts / packs → ${link('Ouvrir la boutique', '/boutique')}`,
      `• Packs de médailles → ${link('Recharger des médailles', '/boutique/medailles')}`,
      `• Offre du jour → ${link('Voir l’offre', '/boutique?deal=jour')}`,
      '',
      'Astuce : sur un article, tu paies en médailles 🏅 ou en jetons selon ton solde.',
    ].join('\n')
  }

  if (/pari|mise|jeton|cote|odds|pronostic|1n2|bet/.test(t)) {
    return [
      'Pour parier :',
      `1. Va dans ${link('Matchs', '/match')} et ouvre un match (idéalement en direct).`,
      '2. Choisis un marché (1N2, buts, buteur…).',
      '3. Règle ta mise en **jetons**.',
      `4. Retrouve tes tickets dans ${link('Profil', '/profile')} / Mes paris.`,
      '',
      `Classement des parieurs → ${link('Pronostics', '/pronostic?vue=classement')}`,
    ].join('\n')
  }

  if (/groupe|salon|tribune|communaute|communauté/.test(t)) {
    return [
      'Les tribunes supporters :',
      `• Découvrir / créer → ${link('Groupes & tribunes', '/groups')}`,
      '• Depuis un match live, tu peux aussi filtrer le chat par tribune.',
      '',
      'Une tribune publique doit avoir des hashtags pour être trouvée.',
    ].join('\n')
  }

  if (/classement|ranking|leader|cdm|mondial|poule/.test(t)) {
    return [
      `• Classement parieurs → ${link('Pronostics / classement', '/pronostic?vue=classement')}`,
      `• Poules Coupe du monde → ${link('Classements CDM', '/rankings')}`,
      '',
      'Invite des amis pour comparer vos scores plus tard.',
    ].join('\n')
  }

  if (/profil|avatar|personnage|pseudo|compte|favori/.test(t)) {
    return [
      `Ton espace perso → ${link('Profil', '/profile')}`,
      'Tu y gères avatar, favoris, paris et réglages.',
      `Messages privés (dont moi) → icône Messages en haut de l’app.`,
    ].join('\n')
  }

  if (/psg|paris saint|parissg/.test(t)) {
    return `Page club du PSG → ${link('Ouvrir le hub PSG', '/club/psg')}\nTu peux aussi chercher « PSG » dans la barre de recherche.`
  }
  if (/\bom\b|marseille|olympique de marseille/.test(t)) {
    return `Page club de l’OM → ${link('Ouvrir le hub OM', '/club/om')}`
  }
  if (/\bol\b|lyon|olympique lyonnais/.test(t)) {
    return `Page club de l’OL → ${link('Ouvrir le hub OL', '/club/lyon')}`
  }

  if (/live|direct|match|score|canal|channel/.test(t)) {
    return [
      `Tous les matchs → ${link('Agenda Matchs', '/match')}`,
      'Ouvre une carte match pour le salon live, les cotes et le chat.',
      'La recherche en haut de l’accueil trouve aussi un club ou une compétition.',
    ].join('\n')
  }

  if (/abonnement|ultra|ambassadeur|premium|formule/.test(t)) {
    return `Les formules Talk Foot → ${link('Voir les abonnements', '/abonnement')}\nUltra et Ambassadeur débloquent plus d’options (tribunes, tokens…).`
  }

  if (/ami|mp|message prive|message privé|coach|assistant|aide|help/.test(t)) {
    return [
      'Tu es déjà dans mon fil privé — chaque compte a **sa** conversation avec moi.',
      `Pour retrouver des matchs : ${link('Matchs', '/match')}`,
      `Pour la boutique : ${link('Boutique', '/boutique')}`,
      'Pose une question précise, je te renvoie au bon endroit.',
    ].join('\n')
  }

  if (/merci|thanks|nickel|super|parfait/.test(t)) {
    return `Avec plaisir 🙌 Bon match — ${link('retour aux matchs', '/match')} si tu veux enchaîner.`
  }

  if (/\?|comment|pourquoi|ou |où |ouvrir|trouver|explique|c est quoi|c'est quoi/.test(t)) {
    return [
      'Je peux t’envoyer au bon endroit. Exemples de questions :',
      '• « où parier »',
      '• « ouvrir la boutique »',
      '• « page PSG »',
      '• « groupes »',
      '',
      `Sinon parcours : ${link('Matchs', '/match')} · ${link('Boutique', '/boutique')} · ${link('Groupes', '/groups')} · ${link('Profil', '/profile')}`,
    ].join('\n')
  }

  return [
    'Je n’ai pas tout saisi, mais je peux te guider :',
    `• ${link('Matchs & live', '/match')}`,
    `• ${link('Boutique', '/boutique')}`,
    `• ${link('Groupes', '/groups')}`,
    `• ${link('Profil', '/profile')}`,
    '',
    'Reformande par exemple : « ouvrir les paris » ou « offre du jour ».',
  ].join('\n')
}
