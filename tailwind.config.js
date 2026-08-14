/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#007BFF',
        'primary-dark': '#0056b3',
        'secondary': '#6c757d',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 8px -1px rgba(15, 23, 42, 0.02)',
        'premium-hover': '0 12px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'premium-glow': '0 0 18px 2px rgba(0, 123, 255, 0.12)',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'pop-in': {
            'from': {
                opacity: '0',
                transform: 'scale(0.95) translateY(10px)',
            },
            'to': {
                opacity: '1',
                transform: 'scale(1) translateY(0)',
            },
        },
        'slide-in-up': {
          'from': { opacity: '0', transform: 'translateY(1rem)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '50%': { opacity: '0' },
        },
        'ping-slow': {
          '75%, 100%': {
            transform: 'scale(1.8)',
            opacity: '0'
          }
        },
      },
      animation: {
          'fade-in': 'fade-in 0.3s ease-out forwards',
          'pop-in': 'pop-in 0.3s ease-out forwards',
          'slide-in-up': 'slide-in-up 0.4s ease-out forwards',
          'blink': 'blink 1s step-end infinite',
          'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    }
  },
  plugins: [],
}
