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
        tf: {
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
        'tf-glow': '0 6px 20px rgba(14, 165, 233, 0.18)',
        'tf-glow-pitch': '0 6px 22px rgba(13, 148, 136, 0.2)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}

