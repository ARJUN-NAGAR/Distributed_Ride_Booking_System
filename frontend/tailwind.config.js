/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: 'hsl(225, 30%, 6%)',
          900: 'hsl(225, 28%, 8%)',
          800: 'hsl(225, 25%, 10%)',
          700: 'hsl(225, 22%, 14%)',
          600: 'hsl(225, 20%, 18%)',
        },
        violet: {
          400: 'hsl(260, 85%, 75%)',
          500: 'hsl(260, 85%, 65%)',
          600: 'hsl(260, 85%, 55%)',
        },
        emerald: {
          400: 'hsl(155, 70%, 60%)',
          500: 'hsl(155, 70%, 50%)',
        },
        amber: {
          400: 'hsl(40, 95%, 65%)',
          500: 'hsl(40, 95%, 60%)',
        },
        crimson: {
          400: 'hsl(0, 75%, 65%)',
          500: 'hsl(0, 75%, 55%)',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px hsl(155, 70%, 50%)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px hsl(155, 70%, 50%)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
