export type AppLocale = 'fr' | 'en' | 'es' | 'de' | 'it'

export const APP_LOCALES: readonly AppLocale[] = ['fr', 'en', 'es', 'de', 'it'] as const

export type MessageTree = {
  [key: string]: string | MessageTree
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'fr' || value === 'en' || value === 'es' || value === 'de' || value === 'it'
}

export function localeTag(locale: AppLocale): string {
  switch (locale) {
    case 'en':
      return 'en-GB'
    case 'es':
      return 'es-ES'
    case 'de':
      return 'de-DE'
    case 'it':
      return 'it-IT'
    default:
      return 'fr-FR'
  }
}

export function localeHtmlLang(locale: AppLocale): string {
  return locale
}

/** Résout `nav.home` dans un arbre de messages. */
export function resolveMessage(tree: MessageTree, path: string): string | undefined {
  const parts = path.split('.')
  let cur: string | MessageTree | undefined = tree
  for (const part of parts) {
    if (!cur || typeof cur === 'string') return undefined
    cur = cur[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function detectLocaleFromNavigator(language: string): AppLocale | null {
  const nav = language.toLowerCase()
  if (nav.startsWith('fr')) return 'fr'
  if (nav.startsWith('en')) return 'en'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('de')) return 'de'
  if (nav.startsWith('it')) return 'it'
  return null
}
