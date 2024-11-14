/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: { 
      colors: {
        cyber: {
          primary: '#00ff9d',
          secondary: '#ff00ff',
          tertiary: '#00ffff',
          dark: '#0a0a16',
          darker: '#050508',
        }
      },
      boxShadow: {
        'cyber': '0 0 10px rgba(0, 255, 157, 0.2)',
        'cyber-hover': '0 0 20px rgba(255, 0, 255, 0.3)',
        'cyber-box': 'inset 0 0 20px rgba(0, 255, 157, 0.1), 0 0 20px rgba(0, 255, 157, 0.1)',
        'toggle': '0 0 10px rgba(0, 255, 157, 0.3)',
      },
      animation: {
        tilt: 'tilt 10s infinite linear',
        'toggle-glow': 'toggle-glow 2s infinite',
      },
      keyframes: {
        tilt: {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(0.5deg)', 
          },
          '75%': {
            transform: 'rotate(-0.5deg)',
          },
        },
        'toggle-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(0, 255, 157, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 15px rgba(0, 255, 157, 0.4)',
          },
        },
      },
    },
  },
  plugins: [],
}