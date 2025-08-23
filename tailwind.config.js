/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0b132b',
        'secondary': '#1c2541',
        'accent': '#3a506b',
        'highlight': '#5bc0be',
        'light': '#e0e0e0',
        'blue-50': '#f0f7ff',
        'yellow-50': '#fffbeb',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}