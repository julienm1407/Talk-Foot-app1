/**
 * Tokens exposés côté TS (tests, Storybook futur, logique conditionnelle).
 * La source visuelle reste `design-tokens.css` + Tailwind.
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

/** Classe utilitaire focus — à combiner avec outline-none sur les contrôles stylés */
export const TF_FOCUS_VISIBLE =
  'outline-none focus-visible:ring-2 focus-visible:ring-tf-dark/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tf-focus-ring-bg)]'
