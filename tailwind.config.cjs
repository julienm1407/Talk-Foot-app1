/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        'tf-0': 'var(--tf-space-0)',
        'tf-1': 'var(--tf-space-1)',
        'tf-2': 'var(--tf-space-2)',
        'tf-3': 'var(--tf-space-3)',
        'tf-4': 'var(--tf-space-4)',
        'tf-5': 'var(--tf-space-5)',
        'tf-6': 'var(--tf-space-6)',
        'tf-8': 'var(--tf-space-8)',
        'tf-10': 'var(--tf-space-10)',
        'tf-12': 'var(--tf-space-12)',
        'tf-16': 'var(--tf-space-16)',
        'tf-20': 'var(--tf-space-20)',
      },
      maxWidth: {
        'tf-sm': 'var(--tf-max-w-sm)',
        'tf-content': 'var(--tf-max-w-content)',
        'tf-wide': 'var(--tf-max-w-wide)',
        'tf-ultra': 'var(--tf-max-w-ultra)',
        'tf-channel': 'var(--tf-max-w-channel)',
        'tf-channel-stadium': 'var(--tf-max-w-channel-stadium)',
        'tf-rails': 'var(--tf-rails-shell)',
        'tf-carousel-slide': 'var(--tf-carousel-slide)',
        'tf-article-body': 'var(--tf-article-body)',
        'tf-article-inner': 'var(--tf-article-inner)',
        'tf-modal-wide': 'var(--tf-modal-wide)',
        'tf-hub-rail': 'var(--tf-hub-rail-cap)',
      },
      borderRadius: {
        'tf-sm': 'var(--tf-radius-sm)',
        'tf-md': 'var(--tf-radius-md)',
        'tf-lg': 'var(--tf-radius-lg)',
        'tf-xl': 'var(--tf-radius-xl)',
        'tf-2xl': 'var(--tf-radius-2xl)',
        'tf-3xl': 'var(--tf-radius-3xl)',
        'tf-pill': 'var(--tf-radius-pill)',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      fontSize: {
        'tf-xs': ['var(--tf-text-xs)', { lineHeight: 'var(--tf-text-xs--line)' }],
        'tf-sm': ['var(--tf-text-sm)', { lineHeight: 'var(--tf-text-sm--line)' }],
        'tf-base': ['var(--tf-text-base)', { lineHeight: 'var(--tf-text-base--line)' }],
        'tf-md': ['var(--tf-text-md)', { lineHeight: 'var(--tf-text-md--line)' }],
        'tf-lg': ['var(--tf-text-lg)', { lineHeight: 'var(--tf-text-lg--line)' }],
        'tf-xl': ['var(--tf-text-xl)', { lineHeight: 'var(--tf-text-xl--line)' }],
        'tf-2xl': [
          'var(--tf-text-2xl)',
          { lineHeight: 'var(--tf-text-2xl--line)', letterSpacing: '0.02em' },
        ],
        'tf-display': [
          'var(--tf-text-display)',
          { lineHeight: 'var(--tf-text-display--line)', letterSpacing: '0.022em' },
        ],
      },
      boxShadow: {
        'tf-elev-0': 'var(--tf-elev-0)',
        'tf-elev-1': 'var(--tf-elev-1)',
        'tf-elev-2': 'var(--tf-elev-2)',
        'tf-elev-3': 'var(--tf-elev-3)',
        'tf-elev-glass-dark': 'var(--tf-elev-glass-dark)',
        'tf-elev-nav-light': 'var(--tf-elev-nav-light)',
        'tf-elev-nav-dark': 'var(--tf-elev-nav-dark)',
        'tf-card': '0 18px 48px rgba(1, 30, 51, 0.1)',
        'tf-glass': '0 24px 64px rgba(0, 8, 22, 0.38), inset 0 1px 0 rgba(255,255,255,0.72)',
        'tf-glow': '0 6px 20px rgba(2, 52, 88, 0.15)',
        'tf-cta': '0 4px 14px rgba(255, 59, 59, 0.28)',
        'tf-glow-pitch': '0 6px 22px rgba(13, 148, 136, 0.2)',
        'tf-glow-live': '0 8px 28px rgba(225, 29, 72, 0.22)',
      },
      minHeight: {
        'tf-touch': 'var(--tf-touch-target-min)',
      },
      minWidth: {
        'tf-touch': 'var(--tf-touch-target-min)',
      },
      fontFamily: {
        display: ['Bigail', 'Bebas Neue', 'Impact', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        /** Titres : éviter le crénage serré par défaut de Tailwind (-0.025em) avec police display */
        tight: '0.02em',
        snug: '0.01em',
        /** Effet condensé volontaire (logos, rare) — préférer `tight` pour les titres */
        condensed: '-0.025em',
      },
      colors: {
        /** Texte / chrome qui suit le thème jour·nuit (voir --tf-app-*-rgb dans index.css) */
        'tf-app-fg': 'rgb(var(--tf-app-fg-rgb) / <alpha-value>)',
        'tf-app-muted': 'rgb(var(--tf-app-muted-rgb) / <alpha-value>)',
        'tf-app-subtle': 'rgb(var(--tf-app-subtle-rgb) / <alpha-value>)',
        tf: {
          void: '#020a14',
          flood: '#f97316',
          'flood-soft': '#ffedd5',
          /** CTA & live (DA) */
          'live-red': '#ff3b3b',
          cta: '#ff3b3b',
          'cta-hover': '#e62e2e',
          /** Structure #023458 */
          dark: '#023458',
          'dark-alt': '#012a45',
          night: '#071e33',
          white: '#ffffff',
          grey: '#5d6978',
          'grey-pastel': '#b3c3cf',
          electric: '#023458',
          'electric-soft': '#e8eef4',
          'electric-deep': '#012a45',
          /** Touche terrain / victoire (teal arbitre / ligne) */
          pitch: '#0d9488',
          'pitch-soft': '#ccfbf1',
          'pitch-bright': '#2dd4bf',
          /** Pelouse & tribune verte */
          grass: '#15803d',
          'grass-dark': '#14532d',
          'grass-soft': '#dcfce7',
          'grass-bright': '#4ade80',
          /** Ligne de touche / craie */
          chalk: '#f0fdf4',
          /** Énergie tribune / flamme */
          ember: '#ea580c',
          'ember-soft': '#ffedd5',
          /** Surfaces teintées (moins blanc cassé) */
          ice: '#e8f4fc',
          mist: '#d8e8f4',
          /** Indigo discret pour hiérarchie */
          vibe: '#6366f1',
          'vibe-soft': '#eef2ff',
          /** Accents section (repérage nav / titres — ~5 %) */
          'nav-match': '#ff9f43',
          'nav-groups': '#6c5ce7',
          'nav-rankings': '#00b894',
          /** 60 · 30 · 10 — dominante / secondaire / accent (voir design-tokens.css) */
          'c60-base': 'var(--tf-c60-base)',
          'c60-mid': 'var(--tf-c60-mid)',
          'c60-deep': 'var(--tf-c60-deep)',
          'c30-surface': 'var(--tf-c30-surface)',
          'c30-surface-soft': 'var(--tf-c30-surface-soft)',
          'c30-border': 'var(--tf-c30-border)',
          'c30-structure': 'var(--tf-c30-structure)',
          'c10-accent': 'var(--tf-c10-accent)',
          'c10-soft': 'var(--tf-c10-accent-soft)',
          'c10-glow': 'var(--tf-c10-accent-glow)',
        },
      },
      keyframes: {
        'tf-stadium-pulse': {
          '0%, 100%': { transform: 'scale(1.04)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.92' },
        },
      },
      animation: {
        'tf-stadium-pulse': 'tf-stadium-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

