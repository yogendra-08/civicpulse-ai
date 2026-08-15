/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dbe5f3',
          200: '#b9cbe9',
          300: '#8aa8d8',
          400: '#5679c2',
          500: '#3457a8',
          600: '#274287',
          700: '#1e3469',
          800: '#162548',
          900: '#0f1a36',
          950: '#0a1024',
        },
        gov: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebeff',
          400: '#599bff',
          500: '#3478ff',
          600: '#1c5af5',
          700: '#1545e1',
          800: '#1839b6',
          900: '#1a338f',
          950: '#152057',
        },
        saffron: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc06d',
          400: '#ff9b32',
          500: '#ff7d0a',
          600: '#f06406',
          700: '#c64a08',
          800: '#9d3b10',
          900: '#7e3210',
          950: '#431704',
        },
        civic: {
          green: '#15803d',
          'green-light': '#22c55e',
          'green-dark': '#166534',
          amber: '#d97706',
          red: '#dc2626',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 26, 54, 0.06), 0 1px 3px 0 rgba(15, 26, 54, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(15, 26, 54, 0.1), 0 2px 6px -1px rgba(15, 26, 54, 0.06)',
        nav: '0 1px 2px 0 rgba(15, 26, 54, 0.08)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-in-fast': 'fade-in-fast 0.2s ease-out both',
        'scale-in': 'scale-in 0.25s ease-out both',
        'slide-in': 'slide-in 0.3s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
