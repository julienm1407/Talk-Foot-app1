import ligue1Logo from '../assets/logos/Ligue1.svg'
import laligaLogo from '../assets/logos/LaLiga_logo_2023.svg'
import serieALogo from '../assets/logos/Serie_A.svg'
import bundesligaLogo from '../assets/logos/Bundesliga_logo.svg'

/** Logos ligue : assets locaux (Vite) + SportMonks pour compétitions sans fichier local. */
export const LEAGUE_OFFICIAL_LOGO_BY_ID: Record<string, string> = {
  'ligue-1': ligue1Logo,
  epl: 'https://images.sportmonks.com/images/soccer/leagues/8.png',
  laliga: laligaLogo,
  'serie-a': serieALogo,
  bund: bundesligaLogo,
  ucl: 'https://images.sportmonks.com/images/soccer/leagues/2.png',
  uel: 'https://images.sportmonks.com/images/soccer/leagues/5.png',
  uecl: 'https://images.sportmonks.com/images/soccer/leagues/848.png',
}
