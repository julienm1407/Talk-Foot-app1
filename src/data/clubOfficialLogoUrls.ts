/**
 * Fallback logos officiels (quand l'API ne fournit pas `image_path`/`logo_path`).
 * Ces URLs restent optionnelles : priorité au logo API.
 */
export const CLUB_OFFICIAL_LOGO_BY_ID: Readonly<Record<string, string>> = {
  che: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  ars: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  liv: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  mci: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  mun: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  tot: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  new: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  psg: '/src/assets/logos/Logo_Paris_SG_1992.svg',
  om: '/src/assets/logos/Olympique_Marseille_logo.svg',
  juv: '/src/assets/logos/Juventus_FC_-_pictogram_black_(Italy,_2017).svg',
  bvb: '/src/assets/logos/Borussia_Dortmund_logo.svg',
  bay: '/src/assets/logos/FC_Bayern_München_logo_(2024).svg',
  bayern: '/src/assets/logos/FC_Bayern_München_logo_(2024).svg',
  inter: '/src/assets/logos/FC_Internazionale_Milano_2021.svg',
}
