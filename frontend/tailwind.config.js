/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      transitionDuration: {
        '600': '600ms',
      },
      keyframes: {
        slideInFromRight: {
          'from': {
            opacity: '0',
            transform: 'translateX(100px) scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0) scale(1)',
          },
        },
      },
      animation: {
        'slide-in-right': 'slideInFromRight 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

