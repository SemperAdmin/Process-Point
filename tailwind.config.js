/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Remap existing app palette to brand-inspired colors
        github: {
          // Deep navy background
          dark: '#0b1f3b',
          // Primary accent → gold
          blue: '#c8a045',
          // Soft cream overlay for cards with bg-opacity
          gray: '#f3e9d6',
          // Cream/beige border
          border: '#e8dcc5'
        },
        // Direct brand palette for explicit use when needed
        semper: {
          navy: '#0b1f3b',
          cream: '#f3e9d6',
          red: '#b22c2c',
          white: '#ffffff',
          gold: '#c8a045'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Oswald', 'Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
