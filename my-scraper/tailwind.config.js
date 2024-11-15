/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        'toggle-knob': '0 3px 0 0 currentColor',
        'toggle-track': '4px 4px 0 0 currentColor',
      },
      colors: {
        dark: {
          bg: '#1a1a2e',
          card: '#16213e',
          border: '#0f3460'
        }
      }
    },
  },
  plugins: [],
}