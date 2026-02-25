/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.ejs",
    "./public/**/*.html",
    "./public/js/**/*.js"
  ],
  safelist: [
    // Keep admin detail page accents stable even when watcher misses file-change scan
    "bg-gradient-to-r",
    "from-slate-900",
    "to-slate-900",
    "via-blue-900",
    "via-cyan-900",
    "bg-cyan-50",
    "text-cyan-700",
    "bg-cyan-600",
    "group-hover:bg-cyan-700",
    "ring-cyan-100",
    "bg-emerald-50",
    "bg-emerald-600",
    "group-hover:bg-emerald-700",
    "ring-emerald-100",
    "border-cyan-200",
    "border-emerald-200",
    "bg-cyan-200/40",
    "bg-blue-200/40"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
