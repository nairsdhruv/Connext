/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090b0e',
          900: '#0f141c',
          800: '#161e2b',
          700: '#222d3d',
          600: '#334155'
        },
        brand: {
          primary: '#06b6d4', // Cyan
          secondary: '#6366f1', // Indigo
          accent: '#10b981', // Emerald
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
