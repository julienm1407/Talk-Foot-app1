import bvbLogo from '../assets/logos/Borussia_Dortmund_logo.svg'
import bayernLogo from '../assets/logos/FC_Bayern_München_logo_(2024).svg'
import interLogo from '../assets/logos/FC_Internazionale_Milano_2021.svg'
import juveLogo from '../assets/logos/Juventus_FC_-_pictogram_black_(Italy,_2017).svg'
import liverpoolLogo from '../assets/logos/Liverpool_logo.svg'
import psgLogo from '../assets/logos/Logo_Paris_SG_1992.svg'
import omLogo from '../assets/logos/Olympique_Marseille_logo.svg'

/**
 * Logos clubs (bundles locaux + Wikimedia) — utilisés quand SportMonks n’a pas d’id équipe.
 */
export const CLUB_OFFICIAL_LOGO_BY_ID: Readonly<Record<string, string>> = {
  psg: psgLogo,
  om: omLogo,
  liv: liverpoolLogo,
  che: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  ars: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  mci: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  mun: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  tot: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  new: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  avl: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Aston_Villa_FC_crest_%282016%29.svg',
  rma: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  fcb: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  atleti: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  sevilla: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  villarreal: 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg',
  bilbao: 'https://upload.wikimedia.org/wikipedia/en/9/98/Athletic_Bilbao_logo.svg',
  valencia: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valencia_CF_logo.svg',
  inter: interLogo,
  juve: juveLogo,
  milan: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_AC_Milan.svg',
  napoli: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg',
  roma: 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg',
  lazio: 'https://upload.wikimedia.org/wikipedia/en/3/3a/S.S._Lazio_badge.svg',
  atalanta: 'https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC_logo.svg',
  fiorentina: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/ACF_Fiorentina_logo.svg',
  bayern: bayernLogo,
  bay: bayernLogo,
  bvb: bvbLogo,
  leverkusen: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  leipzig: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  frankfurt: 'https://upload.wikimedia.org/wikipedia/en/0/04/Eintracht_Frankfurt_logo.svg',
  wolfsburg: 'https://upload.wikimedia.org/wikipedia/en/f/f3/VfL_Wolfsburg_logo.svg',
  monaco: 'https://upload.wikimedia.org/wikipedia/en/5/58/AS_Monaco_FC.svg',
  lyon: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais_logo.svg',
  lille: 'https://upload.wikimedia.org/wikipedia/en/6/6d/Lille_OSC_logo.svg',
  lens: 'https://upload.wikimedia.org/wikipedia/en/2/2c/RC_Lens_logo.svg',
  rennes: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg',
  nice: 'https://upload.wikimedia.org/wikipedia/en/8/8d/OGC_Nice_logo.svg',
}
