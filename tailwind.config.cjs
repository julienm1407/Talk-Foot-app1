/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bigail', 'Bebas Neue', 'Impact', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        /** Texte / chrome qui suit le thème jour·nuit (voir --tf-app-*-rgb dans index.css) */
        'tf-app-fg': 'rgb(var(--tf-app-fg-rgb) / <alpha-value>)',
        'tf-app-muted': 'rgb(var(--tf-app-muted-rgb) / <alpha-value>)',
        'tf-app-subtle': 'rgb(var(--tf-app-subtle-rgb) / <alpha-value>)',
        tf: {
          /** Bleu quasi noir — gradins / ciel de nuit */
          void: '#020a14',
          /** Projecteurs chauds (stade) */
          flood: '#f97316',
          'flood-soft': '#ffedd5',
          /** Rouge live type écran géant */
          'live-red': '#e11d48',
          dark: '#011e33',
          'dark-alt': '#023458',
          night: '#061222',
          white: '#ffffff',
          grey: '#5d86a2',
          'grey-pastel': '#b3c3cf',
          /** Accent « live » — floodlight / écran géant */
          electric: '#0ea5e9',
          'electric-soft': '#e0f2fe',
          'electric-deep': '#0284c7',
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
        },
      },
      boxShadow: {
        'tf-card': '0 18px 48px rgba(1, 30, 51, 0.1)',
        /** Panneau vitré sur fond nuit */
        'tf-glass': '0 24px 64px rgba(0, 8, 22, 0.38), inset 0 1px 0 rgba(255,255,255,0.72)',
        'tf-glow': '0 6px 20px rgba(14, 165, 233, 0.18)',
        'tf-glow-pitch': '0 6px 22px rgba(13, 148, 136, 0.2)',
        'tf-glow-live': '0 8px 28px rgba(225, 29, 72, 0.22)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
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

