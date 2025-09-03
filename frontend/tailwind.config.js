/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
      },
      colors: {
        cro: {
          // Blues
          blue: {
            800: 'var(--cro-blue-800)',
            700: 'var(--cro-blue-700)',
            500: 'var(--cro-blue-500)',
            400: 'var(--cro-blue-400)',
            200: 'var(--cro-blue-200)',
            100: 'var(--cro-blue-100)',
          },
          // Greens
          green: {
            700: 'var(--cro-green-700)',
            600: 'var(--cro-green-600)',
            500: 'var(--cro-green-500)',
            400: 'var(--cro-green-400)',
            200: 'var(--cro-green-200)',
            100: 'var(--cro-green-100)',
          },
          // Purple
          purple: {
            800: 'var(--cro-purple-800)',
            700: 'var(--cro-purple-700)',
            400: 'var(--cro-purple-400)',
          },
          // Platinum (neutrals)
          plat: {
            400: 'var(--cro-plat-400)',
            300: 'var(--cro-plat-300)',
            100: 'var(--cro-plat-100)',
          },
          // Yellow
          yellow: {
            700: 'var(--cro-yellow-700)',
            600: 'var(--cro-yellow-600)',
            500: 'var(--cro-yellow-500)',
            400: 'var(--cro-yellow-400)',
            100: 'var(--cro-yellow-100)',
          },
          // Red (errors/destructive only)
          red: {
            600: 'var(--cro-red-600)',
            500: 'var(--cro-red-500)',
            300: 'var(--cro-red-300)',
          },
          // Core
          'soft-black': {
            700: 'var(--cro-soft-black-700)',
          },
          white: 'var(--cro-white)',
        },
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
      container: {
        center: true,
        padding: '2rem',
      },
    },
  },
  plugins: [],
};
