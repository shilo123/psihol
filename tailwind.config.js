import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#7a5afc',
        'primary-hover': '#6344e3',
        'primary-dark': '#5f41d9',
        'primary-light': '#ebe7fe',
        'background-light': '#f8f7ff',
        'background-dark': '#130f23',
        'text-main': '#100c1c',
        'text-sub': '#5846a0',
        'text-muted': '#6b6684',
        'border-color': '#e9e6f4',
        'surface-light': '#ffffff',
        'surface-dark': '#1e1a32',
        'chat-bg': '#f4f2f9',
      },
      fontFamily: {
        display: ['Heebo', 'Manrope', 'sans-serif'],
        sans: ['Heebo', 'Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(122, 90, 252, 0.08)',
      },
    },
  },
  plugins: [forms, containerQueries],
}
