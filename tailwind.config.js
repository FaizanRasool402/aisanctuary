/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // AI Sanctuary brand palette, extracted from the official logo
        navy: {
          DEFAULT: '#0D3BA8',
          50: '#EAF0FC',
          100: '#CFDCF7',
          200: '#9FB9EF',
          300: '#6F96E7',
          400: '#3F73DF',
          500: '#0D3BA8',
          600: '#0B3390',
          700: '#092A78',
          800: '#062060',
          900: '#041748',
        },
        cyan: {
          DEFAULT: '#3DE0EA',
          light: '#A6F3F8',
        },
        magenta: {
          DEFAULT: '#B85FD6',
          light: '#E3BEF0',
        },
        surface: '#F7F9FC',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(13, 59, 168, 0.08), 0 1px 2px rgba(13, 59, 168, 0.06)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #B85FD6 0%, #3DE0EA 60%, #0D3BA8 100%)',
      },
    },
  },
  plugins: [],
};
