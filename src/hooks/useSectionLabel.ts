import type { AppSectionId } from '../theme/appSectionThemes'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { useLocaleOptional } from '../contexts/LocaleContext'

const SECTION_MESSAGE_KEY: Record<AppSectionId, string> = {
  home: 'nav.home',
  matches: 'nav.matches',
  calendar: 'nav.calendar',
  pronostic: 'nav.pronostic',
  groups: 'nav.groups',
  group: 'nav.group',
  rankings: 'nav.rankings',
  debates: 'nav.debates',
  profile: 'nav.profile',
  channel: 'nav.channel',
  stade: 'nav.stade',
  boutique: 'nav.boutique',
  videos: 'nav.videos',
  default: 'nav.default',
}

/** Libellé de section selon la langue active (repli sur le thème FR). */
export function useSectionLabel(section: AppSectionId): string {
  const locale = useLocaleOptional()
  const fallback = getAppSectionTheme(section).label
  if (!locale) return fallback
  return locale.t(SECTION_MESSAGE_KEY[section], fallback)
}
