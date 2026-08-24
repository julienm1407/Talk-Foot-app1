/**
 * Cadrages vignettes avatar modulaire — tête (nav), buste (chat / tribune), corps (profil).
 * Sans clipPath (provoque des cercles noirs sur les calques PNG modulaires).
 */

/** Crop tête seule (barre nav, etc.). */
export const MODULAR_PP_HEAD_ORIGIN = '50% 2%'
export const MODULAR_PP_HEAD_ZOOM = 2.5
export const MODULAR_PP_HEAD_ZOOM_SMALL = 2.15
export const MODULAR_PP_HEAD_MARGIN_TOP_PX = -12
export const MODULAR_PP_HEAD_MARGIN_TOP_SMALL_PX = -9

/**
 * Crop buste (tête + maillot) — chat & tribune.
 * Zoom plus bas pour laisser le torse lisible dans le cercle.
 */
export const MODULAR_PP_BUST_ORIGIN = '50% 4%'
export const MODULAR_PP_BUST_ZOOM = 1.72
export const MODULAR_PP_BUST_ZOOM_SMALL = 1.58
export const MODULAR_PP_BUST_MARGIN_TOP_PX = -4
export const MODULAR_PP_BUST_MARGIN_TOP_SMALL_PX = -3

export const MODULAR_PP_HEAD_RENDER_BASE_PX = 40

export type ModularThumbCrop = 'head' | 'bust'

/** Props `ProfileCharacterThumb` — barre nav : tête. */
export const MODULAR_PP_NAV_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'head' as const,
  headOffsetPx: -4,
  headScale: 1.55,
}

/** Fil tribune / débat — buste pour montrer le maillot. */
export const MODULAR_PP_CHAT_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'bust' as const,
  headOffsetPx: 0,
  headScale: 1.08,
}

/** Chat live compact / présence tribune — buste un peu plus serré. */
export const MODULAR_PP_CHAT_COMPACT_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'bust' as const,
  headOffsetPx: -1,
  headScale: 1.12,
}

/** Vignettes classement parieurs — buste lisible même en petit. */
export const MODULAR_PP_LEADERBOARD_FRAMING = {
  framingMode: 'topbar' as const,
  crop: 'bust' as const,
  headOffsetPx: 0,
  headScale: 1,
}
