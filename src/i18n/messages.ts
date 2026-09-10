import type { AppLocale, MessageTree } from './types'

/** Libellés UI légers (Big 5). Le reste de l’app reste FR tant que non traduit — aucun impact perf. */
const sharedLanguageNames = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
} as const

function withLangNames<T extends MessageTree>(tree: T): T {
  const language = {
    ...(typeof tree.language === 'object' && tree.language ? tree.language : {}),
    ...sharedLanguageNames,
  }
  return { ...tree, language }
}

export const frMessages = withLangNames({
  language: {
    label: 'Langue',
    choose: 'Choisir la langue',
  },
  nav: {
    home: 'Accueil',
    matches: 'Match',
    calendar: 'Match',
    pronostic: 'Pronostic',
    groups: 'Groupes',
    group: 'Groupe',
    rankings: 'Classement',
    debates: 'Débats',
    profile: 'Profil',
    channel: 'Tribune live',
    stade: 'Stade',
    boutique: 'Boutique',
    videos: 'Vidéos',
    default: 'Talk Foot',
  },
  chrome: {
    homeAria: 'Talk Foot — Accueil',
    monEspaceAria: 'Talk Foot — ouvrir Mon espace',
    back: 'Retour',
    contact: 'Contact',
    about: 'À propos',
    privacy: 'Confidentialité',
    terms: 'CGU',
    deleteAccount: 'Supprimer mon compte',
  },
  cookies: {
    title: 'Confidentialité & cookies',
    body: 'Talk Foot utilise le stockage de ton navigateur pour le compte et les préférences. Sur l’accueil et les pages éditoriales, Google AdSense peut déposer des cookies publicitaires. Les chats live et groupes n’affichent pas de publicité.',
    accept: 'J’accepte',
    later: 'Plus tard',
    more: 'Politique de confidentialité',
  },
  profile: {
    languageTitle: 'Langue de l’application',
    languageHint:
      'Langues des 5 grands championnats. D’autres écrans seront traduits progressivement — l’app reste légère.',
  },
  deleteAccount: {
    title: 'Supprimer mon compte',
    intro:
      'Page publique pour demander ou effectuer la suppression de ton compte Talk Foot et des données associées.',
    section1Title: '1. Suppression immédiate dans l’app',
    section1Body:
      'Si tu es connecté, tu peux supprimer ton compte et tes données Talk Foot depuis ton profil (section Données personnelles).',
    openProfile: 'Ouvrir mon profil → Supprimer mon compte',
    loginThenProfile: 'Se connecter puis aller dans Profil pour supprimer le compte.',
    login: 'Se connecter',
    profile: 'Profil',
    section2Title: '2. Demande par e-mail',
    section2BodyBefore: 'Tu peux aussi demander la suppression par e-mail à',
    section2BodyAfter: '. Nous traitons la demande sous 30 jours maximum.',
    emailCta: 'Demander la suppression par e-mail',
    section3Title: '3. Données concernées',
    section4Title: '4. Confidentialité',
    privacyLink: 'politique de confidentialité',
  },
  footer: {
    bettingNote:
      'Paris entre supporters (jetons fictifs, sans argent réel). Les tribunes de discussion n’affichent pas de publicité.',
  },
})

export const enMessages = withLangNames({
  language: {
    label: 'Language',
    choose: 'Choose language',
  },
  nav: {
    home: 'Home',
    matches: 'Matches',
    calendar: 'Matches',
    pronostic: 'Tips',
    groups: 'Groups',
    group: 'Group',
    rankings: 'Table',
    debates: 'Debates',
    profile: 'Profile',
    channel: 'Live stand',
    stade: 'Stadium',
    boutique: 'Shop',
    videos: 'Videos',
    default: 'Talk Foot',
  },
  chrome: {
    homeAria: 'Talk Foot — Home',
    monEspaceAria: 'Talk Foot — open My space',
    back: 'Back',
    contact: 'Contact',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    deleteAccount: 'Delete account',
  },
  cookies: {
    title: 'Privacy & cookies',
    body: 'Talk Foot uses browser storage for your account and preferences. On the home and editorial pages, Google AdSense may set advertising cookies. Live chats and groups do not show ads.',
    accept: 'I agree',
    later: 'Later',
    more: 'Privacy policy',
  },
  profile: {
    languageTitle: 'App language',
    languageHint: 'Big 5 league languages. More screens will be translated over time — the app stays light.',
  },
  deleteAccount: {
    title: 'Delete my account',
    intro: 'Public page to request or complete deletion of your Talk Foot account and related data.',
    section1Title: '1. Immediate deletion in the app',
    section1Body:
      'If you are signed in, you can delete your Talk Foot account and data from your profile (Personal data section).',
    openProfile: 'Open my profile → Delete my account',
    loginThenProfile: 'Sign in, then go to Profile to delete your account.',
    login: 'Sign in',
    profile: 'Profile',
    section2Title: '2. Email request',
    section2BodyBefore: 'You can also request deletion by email at',
    section2BodyAfter: '. We process requests within 30 days.',
    emailCta: 'Request deletion by email',
    section3Title: '3. Data covered',
    section4Title: '4. Privacy',
    privacyLink: 'privacy policy',
  },
  footer: {
    bettingNote:
      'Fan-to-fan tips (fictional tokens, no real money). Discussion stands do not show ads.',
  },
})

export const esMessages = withLangNames({
  language: {
    label: 'Idioma',
    choose: 'Elegir idioma',
  },
  nav: {
    home: 'Inicio',
    matches: 'Partido',
    calendar: 'Partido',
    pronostic: 'Pronósticos',
    groups: 'Grupos',
    group: 'Grupo',
    rankings: 'Clasificación',
    debates: 'Debates',
    profile: 'Perfil',
    channel: 'Grada en vivo',
    stade: 'Estadio',
    boutique: 'Tienda',
    videos: 'Vídeos',
    default: 'Talk Foot',
  },
  chrome: {
    homeAria: 'Talk Foot — Inicio',
    monEspaceAria: 'Talk Foot — abrir Mi espacio',
    back: 'Volver',
    contact: 'Contacto',
    about: 'Acerca de',
    privacy: 'Privacidad',
    terms: 'Términos',
    deleteAccount: 'Eliminar cuenta',
  },
  cookies: {
    title: 'Privacidad y cookies',
    body: 'Talk Foot usa el almacenamiento del navegador para la cuenta y las preferencias. En inicio y páginas editoriales, Google AdSense puede colocar cookies publicitarias. Los chats en vivo y grupos no muestran anuncios.',
    accept: 'Acepto',
    later: 'Más tarde',
    more: 'Política de privacidad',
  },
  profile: {
    languageTitle: 'Idioma de la app',
    languageHint:
      'Idiomas de las 5 grandes ligas. Traduciremos más pantallas poco a poco — la app sigue siendo ligera.',
  },
  deleteAccount: {
    title: 'Eliminar mi cuenta',
    intro: 'Página pública para solicitar o completar la eliminación de tu cuenta Talk Foot y datos asociados.',
    section1Title: '1. Eliminación inmediata en la app',
    section1Body:
      'Si has iniciado sesión, puedes eliminar tu cuenta y datos Talk Foot desde el perfil (sección Datos personales).',
    openProfile: 'Abrir mi perfil → Eliminar mi cuenta',
    loginThenProfile: 'Inicia sesión y ve a Perfil para eliminar la cuenta.',
    login: 'Iniciar sesión',
    profile: 'Perfil',
    section2Title: '2. Solicitud por correo',
    section2BodyBefore: 'También puedes pedir la eliminación por correo a',
    section2BodyAfter: '. Tratamos la solicitud en un máximo de 30 días.',
    emailCta: 'Solicitar eliminación por correo',
    section3Title: '3. Datos afectados',
    section4Title: '4. Privacidad',
    privacyLink: 'política de privacidad',
  },
  footer: {
    bettingNote:
      'Pronósticos entre aficionados (fichas ficticias, sin dinero real). Las gradas de chat no muestran publicidad.',
  },
})

export const deMessages = withLangNames({
  language: {
    label: 'Sprache',
    choose: 'Sprache wählen',
  },
  nav: {
    home: 'Start',
    matches: 'Spiel',
    calendar: 'Spiel',
    pronostic: 'Tipps',
    groups: 'Gruppen',
    group: 'Gruppe',
    rankings: 'Tabelle',
    debates: 'Debatten',
    profile: 'Profil',
    channel: 'Live-Kurve',
    stade: 'Stadion',
    boutique: 'Shop',
    videos: 'Videos',
    default: 'Talk Foot',
  },
  chrome: {
    homeAria: 'Talk Foot — Start',
    monEspaceAria: 'Talk Foot — Mein Bereich öffnen',
    back: 'Zurück',
    contact: 'Kontakt',
    about: 'Über uns',
    privacy: 'Datenschutz',
    terms: 'AGB',
    deleteAccount: 'Konto löschen',
  },
  cookies: {
    title: 'Datenschutz & Cookies',
    body: 'Talk Foot speichert Konto und Einstellungen im Browser. Auf Start- und Redaktionsseiten kann Google AdSense Werbe-Cookies setzen. Live-Chats und Gruppen zeigen keine Werbung.',
    accept: 'Akzeptieren',
    later: 'Später',
    more: 'Datenschutzerklärung',
  },
  profile: {
    languageTitle: 'App-Sprache',
    languageHint:
      'Sprachen der Big-5-Ligen. Weitere Screens folgen schrittweise — die App bleibt leicht.',
  },
  deleteAccount: {
    title: 'Mein Konto löschen',
    intro: 'Öffentliche Seite zum Anfordern oder Durchführen der Löschung deines Talk-Foot-Kontos und zugehöriger Daten.',
    section1Title: '1. Sofortige Löschung in der App',
    section1Body:
      'Wenn du angemeldet bist, kannst du Konto und Daten unter Profil (Persönliche Daten) löschen.',
    openProfile: 'Profil öffnen → Konto löschen',
    loginThenProfile: 'Anmelden, dann unter Profil das Konto löschen.',
    login: 'Anmelden',
    profile: 'Profil',
    section2Title: '2. Anfrage per E-Mail',
    section2BodyBefore: 'Du kannst die Löschung auch per E-Mail anfordern unter',
    section2BodyAfter: '. Wir bearbeiten Anfragen innerhalb von 30 Tagen.',
    emailCta: 'Löschung per E-Mail anfordern',
    section3Title: '3. Betroffene Daten',
    section4Title: '4. Datenschutz',
    privacyLink: 'Datenschutzerklärung',
  },
  footer: {
    bettingNote:
      'Tipps unter Fans (fiktive Tokens, kein echtes Geld). Chat-Kurven zeigen keine Werbung.',
  },
})

export const itMessages = withLangNames({
  language: {
    label: 'Lingua',
    choose: 'Scegli la lingua',
  },
  nav: {
    home: 'Home',
    matches: 'Partita',
    calendar: 'Partita',
    pronostic: 'Pronostici',
    groups: 'Gruppi',
    group: 'Gruppo',
    rankings: 'Classifica',
    debates: 'Dibattiti',
    profile: 'Profilo',
    channel: 'Curva live',
    stade: 'Stadio',
    boutique: 'Shop',
    videos: 'Video',
    default: 'Talk Foot',
  },
  chrome: {
    homeAria: 'Talk Foot — Home',
    monEspaceAria: 'Talk Foot — apri Il mio spazio',
    back: 'Indietro',
    contact: 'Contatti',
    about: 'Chi siamo',
    privacy: 'Privacy',
    terms: 'Termini',
    deleteAccount: 'Elimina account',
  },
  cookies: {
    title: 'Privacy e cookie',
    body: 'Talk Foot usa lo storage del browser per account e preferenze. Su home e pagine editoriali Google AdSense può impostare cookie pubblicitari. Chat live e gruppi non mostrano annunci.',
    accept: 'Accetto',
    later: 'Più tardi',
    more: 'Informativa privacy',
  },
  profile: {
    languageTitle: 'Lingua dell’app',
    languageHint:
      'Lingue delle 5 grandi leghe. Tradurremo altre schermate gradualmente — l’app resta leggera.',
  },
  deleteAccount: {
    title: 'Elimina il mio account',
    intro: 'Pagina pubblica per richiedere o completare l’eliminazione del tuo account Talk Foot e dei dati associati.',
    section1Title: '1. Eliminazione immediata nell’app',
    section1Body:
      'Se hai effettuato l’accesso, puoi eliminare account e dati Talk Foot dal profilo (sezione Dati personali).',
    openProfile: 'Apri il profilo → Elimina account',
    loginThenProfile: 'Accedi e vai su Profilo per eliminare l’account.',
    login: 'Accedi',
    profile: 'Profilo',
    section2Title: '2. Richiesta via e-mail',
    section2BodyBefore: 'Puoi anche richiedere l’eliminazione via e-mail a',
    section2BodyAfter: '. Elaboriamo le richieste entro 30 giorni.',
    emailCta: 'Richiedi eliminazione via e-mail',
    section3Title: '3. Dati interessati',
    section4Title: '4. Privacy',
    privacyLink: 'informativa privacy',
  },
  footer: {
    bettingNote:
      'Pronostici tra tifosi (gettoni fittizi, senza soldi veri). Le chat in curva non mostrano pubblicità.',
  },
})

export const MESSAGES: Record<AppLocale, MessageTree> = {
  fr: frMessages,
  en: enMessages,
  es: esMessages,
  de: deMessages,
  it: itMessages,
}

export const LOCALE_FLAGS: Record<AppLocale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
}
