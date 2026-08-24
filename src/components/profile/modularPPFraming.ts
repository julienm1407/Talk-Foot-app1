/**
 * Cadrages vignettes avatar modulaire — tête (nav), buste (chat / tribune), corps (profil).
 * Sans clipPath (provoque des cercles noirs sur les calques PNG modulaires).
 *
 * Les sprites sont ~1024px avec beaucoup de transparence : le zoom doit être élevé
 * pour remplir un cercle 28–48px (sinon tête « grain de riz »).
 */

/** Crop tête seule (barre nav, etc.). */
export const MODULAR_PP_HEAD_ORIGIN = '50% 2%'
export const MODULAR_PP_HEAD_ZOOM = 2.55
export const MODULAR_PP_HEAD_ZOOM_SMALL = 2.35
export const MODULAR_PP_HEAD_MARGIN_TOP_PX = -12
export const MODULAR_PP_HEAD_MARGIN_TOP_SMALL_PX = -9

/**
 * Crop buste (tête + haut du maillot) — chat & tribune.
 * Proche du zoom tête, un cran en dessous pour laisser voir le torse.
 */
export const MODULAR_PP_BUST_ORIGIN = '50% 5%'
export const MODULAR_PP_BUST_ZOOM = 2.32
export const MODULAR_PP_BUST_ZOOM_SMALL = 2.18
export const MODULAR_PP_BUST_MARGIN_TOP_PX = -8
export const MODULAR_PP_BUST_MARGIN_TOP_SMALL_PX = -6

export const MODULAR_PP_HEAD_RENDER_BASE_PX = 40

export type ModularThumbCrop = 'head' | 'bust'

/** Props `ProfileCharacterThumb` — barre nav : tête. */
export const MODULAR_PP_NAV_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'head' as const,
  headOffsetPx: -4,
  headScale: 1.72,
}

/** Fil tribune / débat — buste pour montrer le maillot. */
export const MODULAR_PP_CHAT_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'bust' as const,
  headOffsetPx: -2,
  headScale: 1.48,
}

/** Chat live compact / présence tribune — buste un peu plus serré. */
export const MODULAR_PP_CHAT_COMPACT_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'bust' as const,
  headOffsetPx: -3,
  headScale: 1.55,
}

/** Vignettes classement parieurs — buste lisible même en petit. */
export const MODULAR_PP_LEADERBOARD_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'bust' as const,
  headOffsetPx: -1,
  headScale: 1.35,
}
