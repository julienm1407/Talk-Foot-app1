/** Réponses locales pour l’assistant « Coach Talk Foot » (pas d’API). */
export function pickTalkFootBotReply(userMessage: string): string {
  const t = userMessage.toLowerCase()

  if (/\b(salut|bonjour|bonsoir|hey|coucou|yo)\b|^ça va|comment tu vas/.test(t)) {
    return 'Salut ! Je suis Coach Talk Foot 👋 Demande-moi où trouver le live, les paris, les groupes ou ton profil — je te guide.'
  }
  if (/pari|mise|jeton|cote|côte|bet|odds/.test(t)) {
    return 'Les paris : ouvre un match en direct, choisis un marché (1N2, buts…), règle ta mise en jetons. Tes tickets sont dans Profil.'
  }
  if (/groupe|salon|tribune/.test(t)) {
    return 'Les tribunes : onglet Groupes pour rejoindre une tribune supporter. Depuis le live, tu peux filtrer par tribune.'
  }
  if (/classement|ranking|leader/.test(t)) {
    return 'Classements & défis : onglet Classements. Quand tu inviteras de vrais amis, vous pourrez comparer vos scores ici.'
  }
  if (/merci|thanks/.test(t)) {
    return 'Avec plaisir ! Bon match — continue à tester les messages privés si tu veux 🙂'
  }
  if (/\?|comment|pourquoi|où|ou se/.test(t)) {
    return 'Les actus passent par la cloche ; nos échanges, par la bulle Messages en haut. Le live est dans Matchs.'
  }
  return 'Merci pour ton message. Live dans Matchs, MP ici, perso et jetons dans Profil. Une question plus précise ?'
}
