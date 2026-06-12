/**
 * Cadrage unifié des vignettes tête (PP modulaire) — nav, chat, classement, etc.
 * Sans clipPath (provoque des cercles noirs sur les calques PNG modulaires).
 */
export const MODULAR_PP_HEAD_ORIGIN = '50% 2%'
export const MODULAR_PP_HEAD_ZOOM = 2.5
export const MODULAR_PP_HEAD_ZOOM_SMALL = 1.74
export const MODULAR_PP_HEAD_MARGIN_TOP_PX = -12
export const MODULAR_PP_HEAD_MARGIN_TOP_SMALL_PX = -9
export const MODULAR_PP_HEAD_RENDER_BASE_PX = 40

/** Props `ProfileCharacterThumb` pour le même cadrage partout. */
export const MODULAR_PP_NAV_FRAMING = {
  framingMode: 'topbar' as const,
  headOffsetPx: -4,
  headScale: 1.55,
}

/** Vignettes ~28px (classement parieurs) — tête entière, sans zoom nav. */
export const MODULAR_PP_LEADERBOARD_FRAMING = {
  framingMode: 'topbar' as const,
  headOffsetPx: 0,
  headScale: 1,
}
