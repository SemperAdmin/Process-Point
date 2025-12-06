/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        github: {
          dark: '#0d1117',
          blue: '#0969da',
          gray: '#f6f8fa',
          border: '#d0d7de'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}