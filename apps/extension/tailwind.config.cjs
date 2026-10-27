/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/popup.ts",
    "./src/i18n.ts",
    "./src/form-filler.ts",
    "./src/**/*.{html,js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Text on light surfaces (all pass WCAG AA on white)
        ink: {
          DEFAULT: '#141a33',
          muted: '#4a5272',
          subtle: '#6b7290'
        },
        canvas: '#f6f7fb',
        line: {
          DEFAULT: '#e3e6ef',
          strong: '#cdd2e0'
        },
        // FormFully cornflower blue
        brand: {
          DEFAULT: '#4e65ff',
          hover: '#3d52e6',
          soft: '#eef1ff',
          ink: '#2f3fbf'
        },
        danger: {
          DEFAULT: '#b42318',
          soft: '#fef3f2',
          line: '#fecdca'
        },
        coffee: {
          DEFAULT: '#ffdd00',
          ink: '#0d0c22'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,26,51,0.06)',
        dialog: '0 2px 8px rgba(20,26,51,0.12)'
      }
    },
  },
  plugins: [],
}
