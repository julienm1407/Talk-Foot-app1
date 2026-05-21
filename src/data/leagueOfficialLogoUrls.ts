import ligue1Logo from '../assets/logos/Ligue1.svg'
import laligaLogo from '../assets/logos/LaLiga_logo_2023.svg'
import serieALogo from '../assets/logos/Serie_A.svg'
import bundesligaLogo from '../assets/logos/Bundesliga_logo.svg'
import { sportMonksLeagueLogoUrl } from './sportMonksLogoUrls'

/** Logos ligue : assets locaux (Vite) en priorité, puis CDN SportMonks. */
export const LEAGUE_OFFICIAL_LOGO_BY_ID: Record<string, string> = {
  'ligue-1': ligue1Logo,
  epl: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
  laliga: laligaLogo,
  'serie-a': serieALogo,
  bund: bundesligaLogo,
  ucl: 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  uel: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/UEFA_Europa_League_logo_%282021_version%29.svg',
  uecl: 'https://upload.wikimedia.org/wikipedia/en/f/ef/UEFA_Europa_Conference_League_logo.svg',
}

/** Résolution ligue avec repli CDN (ids SM connus). */
export function resolveLeagueLogoUrl(leagueId: string, smLeagueId?: number): string | null {
  const id = leagueId.trim().toLowerCase()
  const local = LEAGUE_OFFICIAL_LOGO_BY_ID[id]
  if (local) return local
  if (smLeagueId != null) {
    const fromCdn = sportMonksLeagueLogoUrl(smLeagueId)
    if (fromCdn) return fromCdn
  }
  return null
}
