/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 50px rgba(16,185,129,0.2)',
      },
      colors: {
        brand: {
          950: '#050816',
        },
      },
    },
  },
  plugins: [],
};
