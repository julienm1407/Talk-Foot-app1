/**
 * Tokens exposés côté TS (tests, Storybook futur, logique conditionnelle).
 * La source visuelle reste `design-tokens.css` + Tailwind.
 *
 * Hiérarchie couleur **60 · 30 · 10** (jour & nuit, `design-tokens.css`) :
 * - **60 %** `--tf-c60-*` : fond page (respiration, masse dominante).
 * - **30 %** `--tf-c30-*` : cartes, verre, bordures, bleu structure `#023458`.
 * - **10 %** `--tf-c10-*` : live & CTA rouge marque — usage ponctuel uniquement.
 */
export const TF_MAX_WIDTH = {
  content: 'var(--tf-max-w-content)',
  wide: 'var(--tf-max-w-wide)',
  ultra: 'var(--tf-max-w-ultra)',
} as const

export const TF_SPACE = {
  pageGutter: 'var(--tf-page-gutter)',
  pageGutterSm: 'var(--tf-page-gutter-sm)',
} as const

/** Référence sémantique 60-30-10 (CSS vars sur `<html>`) */
export const TF_COLOR_RATIO = {
  dominant60: 'var(--tf-c60-base)',
  dominant60Mid: 'var(--tf-c60-mid)',
  dominant60Deep: 'var(--tf-c60-deep)',
  secondary30: 'var(--tf-c30-surface)',
  secondary30Border: 'var(--tf-c30-border)',
  structure30: 'var(--tf-c30-structure)',
  accent10: 'var(--tf-c10-accent)',
} as const

/** Classe utilitaire focus — à combiner avec outline-none sur les contrôles stylés */
export const TF_FOCUS_VISIBLE =
  'outline-none focus-visible:ring-2 focus-visible:ring-tf-dark/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tf-focus-ring-bg)]'
