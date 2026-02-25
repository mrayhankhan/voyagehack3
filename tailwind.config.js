/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tbo: {
          saffron: '#FF6F00',
          rani: '#D81B60',
          turquoise: '#00A5A5',
          emerald: '#007A4D',
          gold: '#EEC219',
          indigo: '#1A0F2E',
        },
        page: {
          bg: '#FAFAFA',
          text: '#1A0F2E',
        },
        card: {
          bg: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
