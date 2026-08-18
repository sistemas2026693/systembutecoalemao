/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        coal: '#0B0B0F',
        carbon: '#121218',
        alemao: {
          red: '#E50914',
          redhot: '#FF3B30',
          gold: '#FFC107',
          goldsoft: '#FF9F1A'
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        glowred: '0 0 40px rgba(229,9,20,.35)',
        glowgold: '0 0 40px rgba(255,193,7,.3)',
        neon: '0 0 24px rgba(255,193,7,.25)'
      }
    }
  },
  plugins: []
}
