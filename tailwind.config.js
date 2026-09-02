/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          dark: '#1E3A8A',
          light: '#EFF6FF',
        },
        page: '#F8FAFC',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
      },
    },
  },
  plugins: [],
}
