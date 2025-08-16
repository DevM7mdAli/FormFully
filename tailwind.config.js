/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./script.js",
    "./src/**/*.{html,js,ts}",
    "./**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand gradient stops (used for backgrounds)
        'brand-start': '#4E65FF88',
        'brand-mid': '#3b8FfFe6', // sky-ish mid tone
        'brand-end': '#FFFFF077', // white-ish end tone

        // Accent gradient stops (used for interactive hover overlays)
        'accent-fuchsia': '#f5d0fe',
        'accent-rose': '#fecdd3',
        'accent-amber': '#fde68a',

        // Glass surfaces (semi–transparent whites)
        surface: {
          glass: 'rgba(255,255,255,0.20)',
          'glass-hover': 'rgba(255,255,255,0.35)',
          'glass-strong': 'rgba(255,255,255,0.55)'
        },

        // Semantic tokens
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4338ca',
          foreground: '#1e1b4b'
        }
      },
      boxShadow: {
        'inner-glow': 'inset 0 0 0 1px rgba(255,255,255,0.25), 0 4px 16px -2px rgba(0,0,0,0.25)',
        'chip': '0 1px 2px rgba(0,0,0,0.25)'
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'pulse-soft': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite'
      }
    },
  },
  plugins: [],
}

