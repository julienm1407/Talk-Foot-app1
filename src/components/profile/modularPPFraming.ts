/**
 * Cadrages vignettes avatar modulaire.
 *
 * Les PNG 1000×1000 ont le perso au centre (tête vers ~9 %, pieds ~90 %),
 * pas collé en haut. Un zoom depuis 0–5 % ne montre que du vide → cercle noir.
 */

/** Boîte utile du sprite (mesurée sur le calque body). Fractions 0–1. */
export const SPRITE_CHAR_BOX = {
  left: 0.28,
  top: 0.02,
  width: 0.44,
  height: 0.90,
} as const

/** Tête + maillot + short — marge au-dessus des cheveux pour éviter la coupe. */
export const SPRITE_KIT_BOX = {
  left: 0.28,
  top: 0.02,
  width: 0.44,
  height: 0.60,
} as const

/** Visage seul (avec marge cheveux). */
export const SPRITE_HEAD_BOX = {
  left: 0.34,
  top: 0.02,
  width: 0.32,
  height: 0.28,
} as const

export const MODULAR_PP_HEAD_RENDER_BASE_PX = 40

export type ModularThumbCrop = 'head' | 'bust' | 'kit'

/** Compat exports (anciens zooms tête — plus utilisés pour le cadrage). */
export const MODULAR_PP_HEAD_ORIGIN = '50% 12%'
export const MODULAR_PP_HEAD_ZOOM = 1
export const MODULAR_PP_HEAD_ZOOM_SMALL = 1
export const MODULAR_PP_HEAD_MARGIN_TOP_PX = 0
export const MODULAR_PP_HEAD_MARGIN_TOP_SMALL_PX = 0
export const MODULAR_PP_BUST_ORIGIN = '50% 22%'
export const MODULAR_PP_BUST_ZOOM = 1
export const MODULAR_PP_BUST_ZOOM_SMALL = 1
export const MODULAR_PP_BUST_MARGIN_TOP_PX = 0
export const MODULAR_PP_BUST_MARGIN_TOP_SMALL_PX = 0

const KIT_FRAMING = {
  framingMode: 'auto' as const,
  crop: 'kit' as const,
  headOffsetPx: 0,
  headScale: 1,
}

/** Barre nav : tenue visible (tête + maillot + short). */
export const MODULAR_PP_NAV_FRAMING = { ...KIT_FRAMING }

/** Fil tribune / débat. */
export const MODULAR_PP_CHAT_FRAMING = { ...KIT_FRAMING }

/** Chat live compact / présence tribune. */
export const MODULAR_PP_CHAT_COMPACT_FRAMING = { ...KIT_FRAMING }

/** Classement parieurs. */
export const MODULAR_PP_LEADERBOARD_FRAMING = { ...KIT_FRAMING }
