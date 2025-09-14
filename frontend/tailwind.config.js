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
            600: 'var(--cro-blue-600)',
            500: 'var(--cro-blue-500)',
            400: 'var(--cro-blue-400)',
            300: 'var(--cro-blue-300)',
            200: 'var(--cro-blue-200)',
            100: 'var(--cro-blue-100)',
            50: 'var(--cro-blue-50)',
          },
          // Greens
          green: {
            800: 'var(--cro-green-800)',
            700: 'var(--cro-green-700)',
            600: 'var(--cro-green-600)',
            500: 'var(--cro-green-500)',
            400: 'var(--cro-green-400)',
            300: 'var(--cro-green-300)',
            200: 'var(--cro-green-200)',
            100: 'var(--cro-green-100)',
            50: 'var(--cro-green-50)',
          },
          // Purple
          purple: {
            800: 'var(--cro-purple-800)',
            700: 'var(--cro-purple-700)',
            600: 'var(--cro-purple-600)',
            500: 'var(--cro-purple-500)',
            400: 'var(--cro-purple-400)',
            300: 'var(--cro-purple-300)',
            200: 'var(--cro-purple-200)',
            100: 'var(--cro-purple-100)',
            50: 'var(--cro-purple-50)',
          },
          // Platinum (neutrals)
          plat: {
            400: 'var(--cro-plat-400)',
            300: 'var(--cro-plat-300)',
            200: 'var(--cro-plat-200)',
            100: 'var(--cro-plat-100)',
            50: 'var(--cro-plat-50)',
          },
          // Yellow
          yellow: {
            800: 'var(--cro-yellow-800)',
            700: 'var(--cro-yellow-700)',
            600: 'var(--cro-yellow-600)',
            500: 'var(--cro-yellow-500)',
            400: 'var(--cro-yellow-400)',
            300: 'var(--cro-yellow-300)',
            200: 'var(--cro-yellow-200)',
            100: 'var(--cro-yellow-100)',
            50: 'var(--cro-yellow-50)',
          },
          // Red (errors/destructive only)
          red: {
            600: 'var(--cro-red-600)',
            500: 'var(--cro-red-500)',
            300: 'var(--cro-red-300)',
          },
          // Core
          'soft-black': {
            900: 'var(--cro-soft-black-900)',
            700: 'var(--cro-soft-black-700)',
            600: 'var(--cro-soft-black-600)',
            500: 'var(--cro-soft-black-500)',
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
