/**
 * Cadrage unifié des vignettes tête (PP modulaire) — nav, chat, classement, etc.
 * Aligné sur le recadrage `Avatar2DKitPreview` (crop sous le cou, zoom centré visage).
 */
export const MODULAR_PP_HEAD_CLIP_BOTTOM_PCT = 50
export const MODULAR_PP_HEAD_ORIGIN = '50% 30%'
export const MODULAR_PP_HEAD_ZOOM = 2.35
export const MODULAR_PP_HEAD_MARGIN_TOP_PX = -8

/** Props `ProfileCharacterThumb` pour le même cadrage partout. */
export const MODULAR_PP_NAV_FRAMING = {
  framingMode: 'topbar' as const,
  headOffsetPx: 0,
  headScale: 1,
}
