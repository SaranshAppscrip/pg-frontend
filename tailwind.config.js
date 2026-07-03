/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F2',
        ink: '#2B2420',
        'ink-soft': '#6B5F56',
        border: '#E9E1DA',
        rose: {
          DEFAULT: '#A8425F',
          soft: '#F3E3E7',
        },
        sage: {
          DEFAULT: '#4B7B6F',
          soft: '#E4EEEB',
        },
        clay: {
          DEFAULT: '#C97B3D',
          soft: '#F6E9DA',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(43, 36, 32, 0.06), 0 1px 2px rgba(43, 36, 32, 0.04)',
      },
    },
  },
  plugins: [],
};
