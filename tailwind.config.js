/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All colours reference CSS variables — theme-aware
        lime: '#C8F135',
        'lime-dark': '#a8cc1f',

        // Semantic tokens — defined in index.css per theme
        surface: 'var(--color-surface)',      // page background
        'surface-2': 'var(--color-surface-2)', // card / panel
        'surface-3': 'var(--color-surface-3)', // input / hover
        border: 'var(--color-border)',       // default border
        'border-strong': 'var(--color-border-strong)',
        primary: 'var(--color-primary)',      // main text
        secondary: 'var(--color-secondary)',    // muted text
        hint: 'var(--color-hint)',         // placeholder / very muted
        accent: 'var(--color-accent)',       // lime accent (same both themes)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-dot': 'pulseDot 2s infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
